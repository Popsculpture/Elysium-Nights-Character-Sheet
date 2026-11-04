/* ===========================================================================
   ELYSIUM NIGHTS · Area of Effect diagram
   An interactive template for the Codex's Space, Speed & Area panel: pick a
   grid, a shape and a size, and see which spaces the Area catches.

   WHAT THE BOOK SETTLES, and this draws literally (Part 2, Movement &
   Distance > Area, pulled 2026-09-09):
     Sphere (Area X)  a burst centered on a point you can see, filling every
                      space within X of it. X is the RADIUS.
     Cone (Area X)    spreads from you or the weapon's muzzle in a direction
                      you choose, "reaching X spaces at its widest point",
                      and elsewhere "a triangular burst originating from the
                      Shaper". X is the WIDEST POINT, not the length.
     Line (Area X)    X spaces long, 1 space wide unless the entry says else.
     Cube (Area X)    a square zone X spaces on each EDGE, placed on a point
                      or surface you can see. X is the EDGE, not a radius.
     Aura (Area X)    centered on you, X spaces in every direction, moving
                      with you. X is the RADIUS.
   Both grids are the book's too: "Combat usually plays out on a grid (1 inch
   squares or hexagons work). Each space represents roughly 5 ft. or 1 meter."

   WHAT THE BOOK DOES NOT SETTLE, and this file therefore CHOOSES. These are
   drawing conventions, not rules, and the widget says so on its face rather
   than letting a picture pass for a ruling. The author's ruling of 3 November
   2026 (Spheres and Auras are round; Cones symmetric) set the current set:
     1. Membership by centre. A space is in an area when its CENTRE is, and
        distance runs in a straight line between centres, counted in spaces
        (a hex is one space across its flats). Nothing is caught by a corner.
     2. Sphere and Aura. Every space whose centre lies within X and a half of
        the point: X spaces out along each axis, round rather than square.
        (Area 3 is 37 spaces on a square grid, not the old 7 by 7 of 49.)
     3. Cone. A triangle from you: X long, X across at its far end, so it
        widens half a space either side per space of length, symmetric about
        its heading. Area 3 on a square grid is rows of 1, 3 and 3; Area 5
        is 1, 3, 3, 5, 5. A space is in when its centre is inside the triangle.
        An even row cannot sit centred on a heading, so an even-sized Cone
        comes out one space wider at its far end (Area 4: 1, 3, 3, 5).
     4. Line. The spaces whose centres lie within half a space of its path,
        one space wide at any heading. Its length counts spaces along the
        heading, so a diagonal Line on a square grid still catches X spaces.
     5. Cube. X spaces on each edge, centred on its point (for an even size
        the point is one of its middle spaces). The book calls it a "square
        zone" and gives no hex version, so on hex it is X rows of X, centred,
        and labelled an approximation.

   Origin. Sphere and Cube are placed on a point you pick, centred on it;
   Cone, Line and Aura start on you. The marker shows which.

   Facing and navigating (4 Nov 2026, the author: "clinical examples of what the
   templates look like", with the Visualize map's controls but none of its
   flourish). A Cone or a Line faces any of eight directions on a square grid,
   the diagonals included, and six on hex: the compass, or a tap or a drag on
   the map the way it should face. Pinch, or Ctrl and the wheel, zooms about the
   pointer (a plain wheel zooms too once the map has been clicked, and scrolls
   the page otherwise); a drag pans when the shape has nothing to aim, a long
   press then a drag or the middle button pans when it does; FIT comes back. A
   new shape, size or grid fits itself again. On a touch screen an up or down
   swipe scrolls the page until the map is tapped, so the Codex never traps a
   reader; a tap anywhere else lets it go again. The previous, fixed version is the
   git tag restore/codex-aoe-template-v1.

   Built as an SVG STRING and handed to el(..., {html}), which is what nine of
   the ten JS-built SVGs in this app do; el() itself cannot make SVG, since it
   calls createElement and would land in the HTML namespace. Every colour is a
   class resolved in theme.css, so all three skins and every palette reach it
   without a second definition here.

   No em or en dashes anywhere in this file (house style).
   =========================================================================== */
window.EN = window.EN || {};

EN.aoeGrid = (function () {
  var el = EN.ui.el, clear = EN.ui.clear;

  /* Module scope, exactly like codex.js's _open and _filter: these outlive any
     EN.app.render() teardown, and the widget redraws only its own box, so the
     controls are never replaced and never lose focus. */
  var _grid = "square";     // "square" or "hex"
  var _shape = "sphere";
  var _size = 3;

  var _heading = 0;         // degrees clockwise from east (y runs down); each grid snaps it to its own steps
  var _view = null;         // a view set by hand {cx, cy, hw, hh} in spaces; null = fit the shape
  var _viewFor = "";        // the shape, size and grid that view was set on: a new one fits itself
  var _dragView = null;     // the view held still while a drag aims
  var _gest = null, _ptrs = {};
  var _engaged = false;      // a mouse or a pen has pressed on the map: a plain wheel zooms until the pointer leaves
  var _touched = false;      // a finger has tapped the map: it takes every touch (.aoe-engaged) until a press elsewhere
  var _stage = null, _redraw = null, _lastV = null, _lastFit = null;

  /* Headings: eight on a square grid (45 degrees, the diagonals included), six on hex (60), clockwise
     from east, the same set as the Flow tab's Visualize window (js/flowviz.js). Every heading is drawn
     through cellsAt(), membership by centre, so a diagonal Cone is an honest triangle and a diagonal
     Line still catches X spaces. Switching grids keeps the nearest heading. */
  var SQ_DIRS = ["E", "SE", "S", "SW", "W", "NW", "N", "NE"];
  var HEX_DIRS = ["E", "SE", "SW", "W", "NW", "NE"];
  function dirs() { return _grid === "hex" ? HEX_DIRS : SQ_DIRS; }
  function stepDeg() { return 360 / dirs().length; }
  function facing() { var n = dirs().length; return ((Math.round(_heading / stepDeg()) % n) + n) % n; }
  function facingName() { return dirs()[facing()]; }
  function headingDeg() { return facing() * stepDeg(); }
  // Cone and Line are the shapes the book gives a direction; the other three are placed, not aimed
  function aimed(shape) { return shape === "cone" || shape === "line"; }

  var SQ = 24;              // square cell, px
  var HEXR = 15;            // hex circumradius, px
  var MAXN = 12;

  function shapeList() {
    var s = ((EN.basics || {}).space || {}).shapes || [];
    return s.map(function (sh) { return { key: sh.name.toLowerCase(), name: sh.name, x: sh.x || "size", text: sh.text }; });
  }
  function shapeInfo(key) {
    var list = shapeList();
    for (var i = 0; i < list.length; i++) { if (list[i].key === key) return list[i]; }
    return list[0] || { key: "sphere", name: "Sphere", x: "radius", text: "" };
  }

  /* ---- the geometry: membership by centre (see the header). Origin 0,0 is the space the area
     starts on or is placed on; heading 0 is east and angles turn clockwise (y runs down). Square
     cells are {x,y}; hex cells are axial {q,r}, pointy top. */
  var SQ3 = Math.sqrt(3), EPS = 1e-6;
  function centreOf(grid, c) { return grid === "hex" ? { x: c.q + c.r / 2, y: c.r * SQ3 / 2 } : { x: c.x, y: c.y }; }
  function roundDist(grid, c) { var p = centreOf(grid, c); return Math.sqrt(p.x * p.x + p.y * p.y); }
  // every space whose centre lies within R of the origin
  function around(grid, R) {
    var out = [], a, b, B;
    if (grid === "hex") {
      B = Math.ceil(R / (SQ3 / 2)) + 1;
      for (b = -B; b <= B; b++) for (a = -Math.ceil(R) - B; a <= Math.ceil(R) + B; a++) { var h = { q: a, r: b }; if (roundDist("hex", h) <= R + EPS) out.push(h); }
    } else {
      B = Math.ceil(R);
      for (a = -B; a <= B; a++) for (b = -B; b <= B; b++) { var q = { x: a, y: b }; if (roundDist("square", q) <= R + EPS) out.push(q); }
    }
    return out;
  }
  // a Cube: n spaces on each edge, centred on its point (on hex, n rows of n, centred, an approximation)
  function cubeCells(grid, n) {
    var raw = [], a, r, lo = -Math.floor((n - 1) / 2);
    if (grid !== "hex") { for (a = lo; a < lo + n; a++) for (r = lo; r < lo + n; r++) raw.push({ x: a, y: r }); return raw; }
    for (r = 0; r < n; r++) for (a = 0; a < n; a++) raw.push({ q: a - Math.floor(r / 2), r: r });
    var mx = 0, my = 0;
    raw.forEach(function (c) { var p = centreOf("hex", c); mx += p.x; my += p.y; });
    mx /= raw.length; my /= raw.length;
    var best = raw[0], bd = Infinity;
    raw.forEach(function (c) { var p = centreOf("hex", c), dd = (p.x - mx) * (p.x - mx) + (p.y - my) * (p.y - my); if (dd < bd - EPS) { bd = dd; best = c; } });
    return raw.map(function (c) { return { q: c.q - best.q, r: c.r - best.r }; });
  }
  /* The spaces an area catches, at a heading in degrees (Cone and Line only; the others are round
     or square and placed). Sphere and Aura: centre within n + 1/2. Cone: centre inside the triangle
     n long and n across at its far end (half-width t/2 at distance t), out to n + 1/2. Line: centre
     within 1/2 of the path, out to n + 1/2 steps along its heading (a diagonal step on a square grid is one). */
  function cellsAt(grid, shape, n, angleDeg) {
    if (shape === "cube") return cubeCells(grid, n);
    var a = (angleDeg || 0) * Math.PI / 180, ux = Math.cos(a), uy = Math.sin(a);
    /* a Line counts its length in spaces along its heading: on a square grid a diagonal step is one
       space of the line (the author, 3 Nov 2026), so a diagonal Line of X still catches X spaces */
    var stepLen = (shape === "line" && grid !== "hex") ? 1 / Math.max(Math.abs(ux), Math.abs(uy)) : 1;
    // a cone's far corners stand (n + 1/2) x 1.118 out, and a diagonal line (n + 1/2) x 1.414: past the n + 1 that holds the rest
    return around(grid, shape === "cone" ? (n + 0.5) * 1.12 + 0.5 : (n + 0.5) * stepLen + 0.5).filter(function (c) {
      var p = centreOf(grid, c);
      if (shape === "sphere" || shape === "aura") return Math.sqrt(p.x * p.x + p.y * p.y) <= n + 0.5 + EPS;
      var t = p.x * ux + p.y * uy, w = Math.abs(p.y * ux - p.x * uy);
      if (t <= EPS || t > (n + 0.5) * stepLen + EPS) return false;
      return shape === "line" ? w <= 0.5 + EPS : w <= t / 2 + EPS;
    });
  }
  function sqCells(shape, n) { return cellsAt("square", shape, n, 0); }
  function hexCells(shape, n) { return cellsAt("hex", shape, n, 0); }
  function key(a, b) { return a + ":" + b; }

  /* ---- the view: which part of the grid shows, in spaces (centres) ------------------------ */
  var MIN_HALF = 2.5, MAX_HALF = 26, ZOOM_STEP = 1.35, LONG_MS = 450, SLOP = 6;
  function unit() { return _grid === "hex" ? SQ3 * HEXR : SQ; }      // px per space: a square's side, a hex across its flats
  function cellsNow(n) { return cellsAt(_grid, _shape, n, aimed(_shape) ? headingDeg() : 0); }
  // the fit: the shape and its origin, with a space of grid all round
  function fitView(cells) {
    var lx = 0, hx = 0, ly = 0, hy = 0;
    cells.forEach(function (c) { var p = centreOf(_grid, c); lx = Math.min(lx, p.x); hx = Math.max(hx, p.x); ly = Math.min(ly, p.y); hy = Math.max(hy, p.y); });
    var padY = _grid === "hex" ? 1 / SQ3 + SQ3 / 2 : 1.5;
    var hw = (hx - lx) / 2 + 1.5, hh = (hy - ly) / 2 + padY;
    // the frame stays between square and two wide by one tall, so a long Line north never draws a map taller than the page
    hw = Math.max(hw, hh); hh = Math.max(hh, hw / 2);
    /* ...then each edge is pushed out to the next cell boundary, so the fit never ends in a half-cut row
       (square: boundaries at a half; hex rows: a row's top and bottom points). Hex columns stagger row
       by row, so their sides stay ragged, as they always were. */
    var cx = (lx + hx) / 2, cy = (ly + hy) / 2, L = cx - hw, Rt = cx + hw, T = cy - hh, B = cy + hh;
    if (_grid === "hex") {
      var rh = SQ3 / 2, o = 1 / SQ3;
      T = Math.floor((T + o) / rh + EPS) * rh - o; B = Math.ceil((B - o) / rh - EPS) * rh + o;
    } else {
      L = Math.floor(L + 0.5 + EPS) - 0.5; Rt = Math.ceil(Rt - 0.5 - EPS) + 0.5;
      T = Math.floor(T + 0.5 + EPS) - 0.5; B = Math.ceil(B - 0.5 - EPS) + 0.5;
    }
    return { cx: (L + Rt) / 2, cy: (T + B) / 2, hw: (Rt - L) / 2, hh: (B - T) / 2 };
  }
  function viewKey() { return _grid + "|" + _shape + "|" + clampSize(_size); }
  function viewNow(fit) {
    if (_dragView) return _dragView;
    if (_view && _viewFor !== viewKey()) _view = null;                // a new shape, size or grid fits itself
    return _view || fit;
  }
  // every space with any of it in the view
  function inView(V) {
    var out = [], a, b, ry = _grid === "hex" ? 1 / SQ3 : 0.5;
    function vis(c) { var p = centreOf(_grid, c); return Math.abs(p.x - V.cx) < V.hw + 0.5 && Math.abs(p.y - V.cy) < V.hh + ry; }
    if (_grid === "hex") {
      var r0 = Math.floor((V.cy - V.hh) / (SQ3 / 2)) - 1, r1 = Math.ceil((V.cy + V.hh) / (SQ3 / 2)) + 1;
      for (b = r0; b <= r1; b++) for (a = Math.floor(V.cx - V.hw - b / 2) - 1; a <= Math.ceil(V.cx + V.hw - b / 2) + 1; a++) { var h = { q: a, r: b }; if (vis(h)) out.push(h); }
    } else {
      for (a = Math.floor(V.cx - V.hw) - 1; a <= Math.ceil(V.cx + V.hw) + 1; a++) for (b = Math.floor(V.cy - V.hh) - 1; b <= Math.ceil(V.cy + V.hh) + 1; b++) { var q = { x: a, y: b }; if (vis(q)) out.push(q); }
    }
    return out;
  }

  /* ---- the drawing --------------------------------------------------------------------------
     Two passes, because SVG has no z-index: it paints in document order, and neighbouring cells
     share an edge. Emitted in one pass, the 1px stroke of a plain cell drawn LATER lands on top of
     the 1.5px highlight of a caught cell drawn earlier, so a caught space came out with pieces of its
     outline missing. The plain field goes down first, every caught space over it, then the heading,
     the marker last. */
  function hexPoly(cx, cy, r) {
    var pts = [], i, a;
    for (i = 0; i < 6; i++) { a = Math.PI / 180 * (60 * i - 30); pts.push((cx + r * Math.cos(a)).toFixed(2) + "," + (cy + r * Math.sin(a)).toFixed(2)); }
    return pts.join(" ");
  }
  function drawSvg(n) {
    var cells = cellsNow(n), hit = {}, U = unit(), field = "", over = "";
    cells.forEach(function (c) { hit[_grid === "hex" ? key(c.q, c.r) : key(c.x, c.y)] = 1; });
    var fit = fitView(cells.concat([_grid === "hex" ? { q: 0, r: 0 } : { x: 0, y: 0 }]));
    var V = viewNow(fit);
    _lastFit = fit; _lastV = V;
    inView(V).forEach(function (c) {
      var on = !!hit[_grid === "hex" ? key(c.q, c.r) : key(c.x, c.y)], p = centreOf(_grid, c), cls = "aoe-cell" + (on ? " aoe-hit" : ""), shape;
      if (_grid === "hex") shape = '<polygon class="' + cls + '" points="' + hexPoly(p.x * U, p.y * U, HEXR) + '"/>';
      else shape = '<rect class="' + cls + '" x="' + ((p.x - 0.5) * U) + '" y="' + ((p.y - 0.5) * U) + '" width="' + U + '" height="' + U + '"/>';
      if (on) over += shape; else field += shape;
    });
    var s = field + over;
    // an aimed shape's heading, a thin line from its origin to its far end
    if (aimed(_shape)) {
      var ha = headingDeg() * Math.PI / 180;
      var stepK = (_shape === "line" && _grid !== "hex") ? 1 / Math.max(Math.abs(Math.cos(ha)), Math.abs(Math.sin(ha))) : 1, L = (n + 0.5) * stepK * U;
      s += '<line class="aoe-aim" x1="0" y1="0" x2="' + (Math.cos(ha) * L).toFixed(1) + '" y2="' + (Math.sin(ha) * L).toFixed(1) + '"/>';
    }
    s += originMark(0, 0, _grid === "hex" ? HEXR * 0.42 : SQ * 0.30);
    return wrapSvg(s, V, U, cells.length, _shape, n);
  }

  function originMark(cx, cy, r) {
    return '<circle class="aoe-origin" cx="' + cx.toFixed(2) + '" cy="' + cy.toFixed(2) + '" r="' + r.toFixed(2) + '"/>';
  }

  function areaLabel(count, shape, n) {
    return "Area " + n + (shape === "sphere" ? "" : " " + shape) + " on a " + _grid
      + " grid" + (aimed(shape) ? ", facing " + facingName() : "")
      + ", " + count + (count === 1 ? " space" : " spaces");
  }
  function wrapSvg(inner, V, U, count, shape, n) {
    var info = shapeInfo(shape), label = areaLabel(count, shape, n);
    return '<svg class="aoe-svg" viewBox="' + ((V.cx - V.hw) * U).toFixed(1) + " " + ((V.cy - V.hh) * U).toFixed(1) + " " + (2 * V.hw * U).toFixed(1) + " " + (2 * V.hh * U).toFixed(1)
      + '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' + label + '" data-count="' + count + '"><title>' + label + ", " + info.name + '</title>' + inner + "</svg>";
  }

  /* ---- the gestures. One handler for mouse, pen and touch, the Visualize map's:
       a tap or a drag    aims a Cone or a Line the way the pointer is (the view holds still while it does);
       a drag             pans, when the shape has nothing to aim;
       a long press, drag pans (hold still for LONG_MS first), and so does the middle button;
       two fingers        pinch: zoom about their middle, and pan with it;
       Ctrl and the wheel zooms about the pointer (a touchpad pinch arrives as one). A plain wheel zooms
                          once the map has been clicked, until the pointer leaves it; until then it scrolls
                          the page, so the Codex never traps a reader's scroll.
     The move and release listeners sit on the document (bound once, below), because the Codex can be
     redrawn while a gesture runs. */
  function svgRect() { var svg = _stage && _stage.querySelector(".aoe-svg"); return svg ? svg.getBoundingClientRect() : null; }
  function upp(V, r) { return Math.max(2 * V.hw / Math.max(1, r.width), 2 * V.hh / Math.max(1, r.height)); }   // spaces per screen pixel
  function worldAt(V, r, sx, sy) { var u = upp(V, r); return { x: V.cx + (sx - (r.left + r.width / 2)) * u, y: V.cy + (sy - (r.top + r.height / 2)) * u }; }
  // lo: the narrowest a zoom may go from V (a fit tighter than MIN_HALF stays as it is, never pushed out)
  function clampView(cx, cy, hw, aspect, lo) { hw = Math.max(lo == null ? MIN_HALF : lo, Math.min(MAX_HALF, hw)); return { cx: cx, cy: cy, hw: hw, hh: hw * aspect }; }
  function floorFor(V) { return Math.min(MIN_HALF, V.hw); }
  function setView(V) { _view = V; _viewFor = viewKey(); }
  function redrawSoon() { if (_redraw) _redraw(); }
  function zoomAt(sx, sy, f) {
    var V = _lastV, r = svgRect(); if (!V || !r) return;
    var w = worldAt(V, r, sx, sy), NV = clampView(0, 0, V.hw * f, V.hh / V.hw, floorFor(V)), k = NV.hw / V.hw;
    NV.cx = w.x - (w.x - V.cx) * k; NV.cy = w.y - (w.y - V.cy) * k;
    setView(NV);
    var g = _gest;   // a pan or a pinch already running carries on from the zoomed view
    if (g && g.mode === "pan" && _ptrs[g.id]) { g.V0 = NV; g.s0 = { x: _ptrs[g.id].x, y: _ptrs[g.id].y }; }
    else if (g && g.mode === "pinch") {
      var pa = _ptrs[g.ids[0]], pb = _ptrs[g.ids[1]];
      if (pa && pb) { g.V0 = NV; g.d0 = Math.max(1, dist2(pa, pb)); g.m0 = worldAt(NV, g.r0, (pa.x + pb.x) / 2, (pa.y + pb.y) / 2); }
    }
    redrawSoon();
  }
  function dist2(a, b) { return Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y)); }
  // aim a Cone or a Line at a point on the map (in spaces): the nearest of the grid's headings
  function aimAt(p) {
    if (Math.sqrt(p.x * p.x + p.y * p.y) < 0.5) return false;          // on the origin itself: no heading
    var deg = Math.atan2(p.y, p.x) * 180 / Math.PI, before = facing();
    _heading = Math.round(deg / stepDeg()) * stepDeg();
    return facing() !== before;
  }
  function aimFrom(ev) {
    var V = _dragView || _lastV, r = svgRect(); if (!V || !r) return;
    if (aimAt(worldAt(V, r, ev.clientX, ev.clientY))) redrawSoon();
  }
  function setPanning(on) { if (_stage) _stage.classList.toggle("aoe-panning", !!on); }
  function bindStage(st) {
    st.addEventListener("wheel", function (ev) {
      var dy = ev.deltaMode === 1 ? ev.deltaY * 16 : ev.deltaMode === 2 ? ev.deltaY * 400 : ev.deltaY;
      if (!dy || !(ev.ctrlKey || _engaged)) return;          // a plain wheel scrolls the page until the map is clicked
      ev.preventDefault();
      zoomAt(ev.clientX, ev.clientY, Math.exp(Math.max(-60, Math.min(60, dy)) * (ev.ctrlKey ? 0.012 : 0.0016)));
    }, { passive: false });
    st.addEventListener("pointerleave", function () { _engaged = false; });
    st.addEventListener("mousedown", function (ev) { if (ev.button === 1) ev.preventDefault(); });
    st.addEventListener("auxclick", function (ev) { if (ev.button === 1) ev.preventDefault(); });
    st.addEventListener("contextmenu", function (ev) { if (_gest) ev.preventDefault(); });
    st.addEventListener("pointerdown", function (ev) {
      var mid = ev.button === 1;
      if (!mid && ev.button != null && ev.button !== 0) return;
      var r = svgRect(), V = _lastV; if (!r || !V) return;
      if (ev.pointerType === "touch") { _touched = true; st.classList.add("aoe-engaged"); } else _engaged = true;
      _ptrs[ev.pointerId] = { x: ev.clientX, y: ev.clientY };
      var ids = Object.keys(_ptrs);
      if (ids.length >= 2 && !(_gest && _gest.mid)) {               // a second finger: pinch (an aim in progress stops where it is)
        if (_gest) clearTimeout(_gest.timer);
        var pa = _ptrs[ids[0]], pb = _ptrs[ids[1]];
        ev.preventDefault(); _dragView = null;
        _gest = { mode: "pinch", ids: ids.slice(0, 2), d0: Math.max(1, dist2(pa, pb)), m0: worldAt(V, r, (pa.x + pb.x) / 2, (pa.y + pb.y) / 2), V0: V, r0: r };
        setPanning(true); return;
      }
      if (_gest) return;
      ev.preventDefault();
      if (mid) { _gest = { mode: "pan", mid: true, id: ev.pointerId, s0: { x: ev.clientX, y: ev.clientY }, V0: V, r0: r }; setPanning(true); return; }
      var g = _gest = { mode: "pending", id: ev.pointerId, s0: { x: ev.clientX, y: ev.clientY }, V0: V, r0: r, aim: aimed(_shape) };
      g.timer = setTimeout(function () {
        if (_gest !== g || g.mode !== "pending") return;
        g.mode = "pan"; setPanning(true);
        try { if (navigator.vibrate) navigator.vibrate(12); } catch (e) {}
      }, LONG_MS);
    });
  }
  function gestMove(ev) {
    if (_ptrs[ev.pointerId]) _ptrs[ev.pointerId] = { x: ev.clientX, y: ev.clientY };
    var g = _gest; if (!g) return;
    if (g.mode === "pinch") {
      var pa = _ptrs[g.ids[0]], pb = _ptrs[g.ids[1]]; if (!pa || !pb) return;
      var NV = clampView(0, 0, g.V0.hw * g.d0 / Math.max(1, dist2(pa, pb)), g.V0.hh / g.V0.hw, floorFor(g.V0)), u = upp(NV, g.r0);
      NV.cx = g.m0.x - ((pa.x + pb.x) / 2 - (g.r0.left + g.r0.width / 2)) * u;
      NV.cy = g.m0.y - ((pa.y + pb.y) / 2 - (g.r0.top + g.r0.height / 2)) * u;
      setView(NV); redrawSoon(); return;
    }
    if (ev.pointerId !== g.id) return;
    var dx = ev.clientX - g.s0.x, dy = ev.clientY - g.s0.y;
    if (g.mode === "pending" && Math.sqrt(dx * dx + dy * dy) > SLOP) {
      clearTimeout(g.timer);
      if (g.aim) { g.mode = "aim"; _dragView = g.V0; } else { g.mode = "pan"; setPanning(true); }
    }
    if (g.mode === "aim") { aimFrom(ev); return; }
    if (g.mode === "pan") { var u0 = upp(g.V0, g.r0); setView({ cx: g.V0.cx - dx * u0, cy: g.V0.cy - dy * u0, hw: g.V0.hw, hh: g.V0.hh }); redrawSoon(); }
  }
  function gestEnd(ev) {
    delete _ptrs[ev.pointerId];
    var g = _gest; if (!g) return;
    if (g.mode === "pinch") {
      if (g.ids.indexOf(String(ev.pointerId)) === -1) return;
      _gest = null; _ptrs = {}; setPanning(false); redrawSoon(); return;
    }
    if (ev.pointerId !== g.id) return;
    clearTimeout(g.timer); _gest = null;
    if (g.mode === "pending" && g.aim && ev.type === "pointerup") { _dragView = g.V0; aimFrom(ev); }   // a tap aims
    _dragView = null; setPanning(false);
    redrawSoon();
  }
  // a press anywhere off the map lets it go: the page scrolls under a finger and a wheel again
  document.addEventListener("pointerdown", function (ev) {
    if (_stage && _stage.contains(ev.target)) return;
    _engaged = false; _touched = false; if (_stage) _stage.classList.remove("aoe-engaged");
  }, true);
  document.addEventListener("pointermove", gestMove);
  document.addEventListener("pointerup", gestEnd);
  document.addEventListener("pointercancel", gestEnd);

  /* ---- the widget ------------------------------------------------------- */
  // Styled here rather than borrowing .set-col-lab, which lives in the settings tray's
  // injected stylesheet and does not exist until that tray has been opened once.
  function clampSize(v) {
    var n = parseInt(v, 10);
    if (!(n > 0)) n = 1;                       // "", "abc", "0" and negatives all land on 1
    return Math.max(1, Math.min(MAXN, n));
  }
  /* The control goes INSIDE its label, which is what makes the caption the control's
     accessible name and makes clicking the caption focus the control. No ids are involved, so
     there is nothing to keep unique across a render teardown. The type sits on an inner span
     rather than on the label itself: on the label, the 4px gap would fall under the control
     instead of above it. */
  function ctlField(t, ctl) {
    return el("label", { style: { display: "block" } }, [
      el("span", { style: { display: "block", fontFamily: "var(--mono)", fontSize: "9px",
        letterSpacing: ".18em", color: "var(--text3)", marginBottom: "4px" }, text: t }),
      ctl
    ]);
  }
  function capLab(t) { return el("span", { style: { fontFamily: "var(--mono)", fontSize: "9px", letterSpacing: ".18em", color: "var(--text3)" }, text: t }); }
  // the compass: where each heading sits on a three by three pad (hex has no N or S)
  var PAD = [["NW", "\u2196"], ["N", "\u2191"], ["NE", "\u2197"], ["W", "\u2190"], null, ["E", "\u2192"], ["SW", "\u2199"], ["S", "\u2193"], ["SE", "\u2198"]];
  function build() {
    if (!EN.basics || !EN.basics.space) return null;
    var list = shapeList();
    if (!list.length) return null;

    var stage = el("div.aoe-box.aoe-stage");
    var note = el("p.help.aoe-note", { style: { margin: "6px 0 0" } });
    var readout = el("span.mono.aoe-read");
    var pad = el("div.aoe-pad", { role: "group", "aria-label": "Facing" });
    var zoomOut, zoomFit, zoomIn;

    function face(name) {
      var i = dirs().indexOf(name); if (i === -1) return;
      _heading = i * stepDeg(); draw();
    }
    var padFor = "", padMid = null;
    function drawPad() {
      if (padFor !== _grid) {             // the buttons change only with the grid's set of headings
        padFor = _grid; clear(pad);
        PAD.forEach(function (p) {
          if (!p) { pad.appendChild(padMid = el("span.aoe-pad-c.mono")); return; }
          /* the inline cursor keeps #GRIDroid's tap floor even across the pad (see gridChip below) */
          pad.appendChild(dirs().indexOf(p[0]) !== -1
            ? el("button.chip", { type: "button", style: { cursor: "pointer" }, title: "Face " + p[0], "aria-label": "Face " + p[0],
                dataset: { aoeFace: p[0] }, onclick: function () { face(p[0]); } }, p[1])
            : el("span.aoe-pad-x", { "aria-hidden": "true" }));
        });
      }
      // every other redraw updates them in place, so a button pressed from the keyboard keeps its focus
      padMid.textContent = facingName();
      [].slice.call(pad.querySelectorAll("[data-aoe-face]")).forEach(function (b) {
        var on = b.getAttribute("data-aoe-face") === facingName();
        b.classList.toggle("on", on); b.setAttribute("aria-pressed", on ? "true" : "false");
      });
    }
    function draw() {
      var n = clampSize(_size);
      var info = shapeInfo(_shape);
      stage.innerHTML = drawSvg(n);
      facingRow.style.display = aimed(_shape) ? "" : "none";
      drawPad();
      var count = +stage.querySelector(".aoe-svg").getAttribute("data-count");
      readout.textContent = info.name + ", Area " + n + ": " + count + (count === 1 ? " space" : " spaces") + (aimed(_shape) ? ", facing " + facingName() : "");
      var outOff = _lastV.hw >= MAX_HALF - 1e-6, inOff = _lastV.hw <= MIN_HALF + 1e-6, act = document.activeElement;
      if ((outOff && act === zoomOut) || (inOff && act === zoomIn)) zoomFit.focus();   // a disabled button would drop the keyboard's focus
      zoomOut.disabled = outOff; zoomIn.disabled = inOff;
      var fitted = !_view || _viewFor !== viewKey();
      zoomFit.classList.toggle("on", fitted); zoomFit.setAttribute("aria-pressed", fitted ? "true" : "false");
      stage.classList.toggle("aoe-aimable", aimed(_shape));
      var txt = info.text;
      if (_grid === "hex" && _shape === "cube") {
        txt += " The Handbook calls this a square zone and gives no hex version, so it is drawn here as "
          + n + " rows of " + n + ".";
      }
      note.textContent = txt;
    }
    function zoomBy(f) {
      var V = _lastV; if (!V) return;
      setView(clampView(V.cx, V.cy, V.hw * f, V.hh / V.hw, floorFor(V))); draw();
    }

    var shapeSel = el("select", { style: { width: "100%" }, onchange: function () { _shape = this.value; draw(); } },
      list.map(function (sh) {
        return el("option", { value: sh.key, selected: sh.key === _shape, text: sh.name + " (X is the " + sh.x + ")" });
      }));

    /* oninput redraws live while you type, so a half-typed value still shows something sane
       (draw() clamps). onchange then fires on blur, Enter and the spinners, and is where the BOX
       is made to agree with the diagram: without it, typing 99 leaves the field reading 99 beside
       a picture of 12, and the reader has no way to know which one the app believes. */
    var sizeIn = el("input", {
      type: "number", min: "1", max: String(MAXN), value: String(_size), style: { width: "100%" },
      oninput: function () { _size = this.value; draw(); },
      onchange: function () { _size = clampSize(this.value); this.value = String(_size); draw(); }
    });

    function gridChip(k, label) {
      /* The inline cursor is load bearing, not decoration: #GRIDroid's tap floor puts a
         clickable chip on a 36px rung keyed off [style*="cursor: pointer"], while .chip alone
         is the 28px label rung. Without it only the SELECTED chip (which also matches .chip.on)
         got the tall rung, so the pair swapped sizes on every toggle, 8px of height and 6px of
         width. aria-pressed is passed as a STRING because el() turns a boolean into an empty
         attribute, and aria-pressed="" reads as no toggle at all. */
      return el("button.chip" + (_grid === k ? ".on" : ""), {
        type: "button",
        style: { cursor: "pointer" },
        "aria-pressed": _grid === k ? "true" : "false",
        onclick: function () {
          _grid = k;
          // the chips are rebuilt in place rather than through EN.app.render(), so nothing else moves
          gridRow.replaceChild(gridChip("square", "SQUARE"), gridRow.firstChild);
          gridRow.replaceChild(gridChip("hex", "HEX"), gridRow.lastChild);
          draw();
        }
      }, label);
    }
    var gridRow = el("div.row", { style: { gap: "6px" } }, [gridChip("square", "SQUARE"), gridChip("hex", "HEX")]);

    /* FACING, shown only for the two shapes the book aims rather than places: a compass of the grid's
       headings, eight on square and six on hex (N and S stay blank there), the current one named in
       its middle. A tap or a drag on the map aims too. */
    var facingRow = el("div.row", { style: { gap: "10px", alignItems: "center", marginBottom: "10px" } }, [capLab("FACING"), pad]);

    var controls = el("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" } }, [
      ctlField("SHAPE", shapeSel),
      ctlField("SIZE IN SPACES", sizeIn)
    ]);

    zoomOut = el("button.chip", { type: "button", style: { cursor: "pointer" }, dataset: { aoeZoom: "out" }, title: "Zoom out", "aria-label": "Zoom out", onclick: function () { zoomBy(ZOOM_STEP); } }, "\u2212");
    zoomFit = el("button.chip", { type: "button", style: { cursor: "pointer" }, dataset: { aoeZoom: "fit" }, title: "Fit the view to the shape", onclick: function () { _view = null; draw(); } }, "FIT");
    zoomIn = el("button.chip", { type: "button", style: { cursor: "pointer" }, dataset: { aoeZoom: "in" }, title: "Zoom in", "aria-label": "Zoom in", onclick: function () { zoomBy(1 / ZOOM_STEP); } }, "+");
    var bar = el("div.aoe-bar", null, [readout, el("div.row.aoe-zoom", { style: { gap: "4px" } }, [zoomOut, zoomFit, zoomIn])]);
    var hint = el("p.help.aoe-hint", { text: "Pinch, or Ctrl and the wheel, to zoom (a plain wheel zooms once you click the map) · drag to pan, or hold first on a Cone or a Line, which a tap or a drag aims · FIT to come back" });

    _stage = stage; _redraw = draw; _engaged = false; _touched = false;   // a rebuilt map starts let go
    bindStage(stage);
    draw();
    return el("div.aoe-widget", null, [
      el("div.row.between.wrap", { style: { gap: "10px", marginBottom: "8px", alignItems: "center" } }, [
        el("span.mono", { style: { fontSize: "10px", letterSpacing: ".18em", color: "var(--text3)" }, text: "// TEMPLATE" }),
        gridRow
      ]),
      controls,
      facingRow,
      stage,
      bar,
      hint,
      note,
      el("p.help", { style: { margin: "6px 0 0", fontStyle: "italic" },
        text: "The shapes and their sizes are the Handbook's. How the grid counts them is this diagram's own convention: a space is in or out by its center, and distance runs straight between centers. A Sphere or Aura of X takes every space whose center is within X and a half of its point, so it is round. A Cone is a triangle from you, X long and X across at its far end, the same on both sides of its heading; an even-sized Cone is drawn one space wider at its far end, since an even row cannot sit centered on its heading. A Line takes the spaces whose centers lie within half a space of its path, X of them at any heading, diagonals included. Cone, Line and Aura start on you; Sphere and Cube are placed on a point you can see, the Cube centered on it. A Cone or a Line faces eight ways on a square grid, the diagonals included, and six on a hex one." })
    ]);
  }

  /* The geometry, for the Flow tab's Visualize window (js/flowviz.js): the same cells the Codex diagram
     draws, so the two can never disagree about what a Sphere or a Cone catches. Origin 0,0, facing east. */
  return { build: build, sqCells: sqCells, hexCells: hexCells, cellsAt: cellsAt, centreOf: centreOf, roundDist: roundDist };
})();
