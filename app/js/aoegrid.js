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
        X and a half long, so it is one space wide at any heading.
     5. Cube. X spaces on each edge, centred on its point (for an even size
        the point is one of its middle spaces). The book calls it a "square
        zone" and gives no hex version, so on hex it is X rows of X, centred,
        and labelled an approximation.

   Origin. Sphere and Cube are placed on a point you pick, centred on it;
   Cone, Line and Aura start on you. The marker shows which.

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
  var _facing = 0;          // index into the current grid's DIRS, wrapped on read

  /* WHY THE TWO GRIDS TURN BY DIFFERENT AMOUNTS. This diagram turns by exact lattice turns: a
     quarter turn on a square grid maps (x,y) to (-y,x), and a sixth turn on a pointy-top hex maps
     axial (q,r) to (-r,q+r). Both send whole cells onto whole cells, and the shapes are symmetric
     about their heading, so a turned cone is the same cone. The Flow tab's Visualize window
     (js/flowviz.js) also offers the square grid's diagonals, through cellsAt() at 45 degrees: with
     membership by centre a diagonal cone is an honest triangle too. */
  var SQ_DIRS = ["E", "S", "W", "N"];                          // quarter turns, clockwise
  var HEX_DIRS = ["E", "SE", "SW", "W", "NW", "NE"];           // sixth turns, clockwise
  function dirs() { return _grid === "hex" ? HEX_DIRS : SQ_DIRS; }
  function facing() { var d = dirs(); return ((_facing % d.length) + d.length) % d.length; }
  function facingName() { return dirs()[facing()]; }
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
     within 1/2 of the path, out to n + 1/2. */
  function cellsAt(grid, shape, n, angleDeg) {
    if (shape === "cube") return cubeCells(grid, n);
    var a = (angleDeg || 0) * Math.PI / 180, ux = Math.cos(a), uy = Math.sin(a);
    // a cone's far corners stand (n + 1/2) x 1.118 out, past the n + 1 that holds every other shape
    return around(grid, shape === "cone" ? (n + 0.5) * 1.12 + 0.5 : n + 1).filter(function (c) {
      var p = centreOf(grid, c);
      if (shape === "sphere" || shape === "aura") return Math.sqrt(p.x * p.x + p.y * p.y) <= n + 0.5 + EPS;
      var t = p.x * ux + p.y * uy, w = Math.abs(p.y * ux - p.x * uy);
      if (t <= EPS || t > n + 0.5 + EPS) return false;
      return shape === "line" ? w <= 0.5 + EPS : w <= t / 2 + EPS;
    });
  }
  function sqCells(shape, n) { return cellsAt("square", shape, n, 0); }
  function hexCells(shape, n) { return cellsAt("hex", shape, n, 0); }

  function rotSq(c, k) {
    var x = c.x, y = c.y, i, t;
    for (i = 0; i < k; i++) { t = x; x = -y; y = t; }     // quarter turn clockwise, y down
    return { x: x, y: y };
  }
  function rotHex(c, k) {
    var q = c.q, r = c.r, i, nq;
    for (i = 0; i < k; i++) { nq = -r; r = q + r; q = nq; }   // sixth turn clockwise
    return { q: q, r: r };
  }
  function bounds(pts, key1, key2, pad) {
    var lo1 = 0, hi1 = 0, lo2 = 0, hi2 = 0;
    pts.forEach(function (p) {
      if (p[key1] < lo1) lo1 = p[key1]; if (p[key1] > hi1) hi1 = p[key1];
      if (p[key2] < lo2) lo2 = p[key2]; if (p[key2] > hi2) hi2 = p[key2];
    });
    return { lo1: lo1 - pad, hi1: hi1 + pad, lo2: lo2 - pad, hi2: hi2 + pad };
  }

  function key(a, b) { return a + ":" + b; }

  /* ---- the two drawings ------------------------------------------------- */
  function drawSquare(shape, n) {
    var cells = sqCells(shape, n), hit = {}, s = "", k = facing();
    if (k && aimed(shape)) cells = cells.map(function (c) { return rotSq(c, k); });
    cells.forEach(function (c) { hit[key(c.x, c.y)] = 1; });
    var b = bounds(cells.concat([{ x: 0, y: 0 }]), "x", "y", 1);
    var w = (b.hi1 - b.lo1 + 1) * SQ, h = (b.hi2 - b.lo2 + 1) * SQ;
    function px(x) { return (x - b.lo1) * SQ; }
    function py(y) { return (y - b.lo2) * SQ; }
    /* Two passes, because SVG has no z-index: it paints in document order, and neighbouring
       cells share an edge. Emitted in one pass, the 1px stroke of a plain cell drawn LATER lands
       on top of the 1.5px highlight of a caught cell drawn earlier, so a caught space came out
       with pieces of its outline missing along whichever edges its neighbours were drawn after
       it. The plain field goes down first, every caught space over it, the marker last. */
    var over = "";
    for (var x = b.lo1; x <= b.hi1; x++) {
      for (var y = b.lo2; y <= b.hi2; y++) {
        var on = !!hit[key(x, y)];
        var rect = '<rect class="aoe-cell' + (on ? " aoe-hit" : "") + '" x="' + px(x) + '" y="' + py(y) + '" width="' + SQ + '" height="' + SQ + '"/>';
        if (on) over += rect; else s += rect;
      }
    }
    s += over;
    s += originMark(px(0) + SQ / 2, py(0) + SQ / 2, SQ * 0.30);
    return wrapSvg(s, w, h, cells.length, shape, n);
  }

  function hexPoly(cx, cy, r) {
    var pts = [], i, a;
    for (i = 0; i < 6; i++) { a = Math.PI / 180 * (60 * i - 30); pts.push((cx + r * Math.cos(a)).toFixed(2) + "," + (cy + r * Math.sin(a)).toFixed(2)); }
    return pts.join(" ");
  }
  function drawHex(shape, n) {
    var cells = hexCells(shape, n), hit = {}, s = "", k = facing();
    if (k && aimed(shape)) cells = cells.map(function (c) { return rotHex(c, k); });
    cells.forEach(function (c) { hit[key(c.q, c.r)] = 1; });
    var all = cells.concat([{ q: 0, r: 0 }]);
    var b = bounds(all, "q", "r", 1);
    var W = Math.sqrt(3) * HEXR, VS = 1.5 * HEXR;
    /* One hex of margin around the cells, measured in PIXELS, with each row then solving its
       own q range over that same pixel window. A row's screen x is W * (q + r/2), so a q range
       that does not move with r shifts half a hex further right on every row: the field comes
       out a sheared parallelogram inside a rectangular viewBox, which left two empty triangles,
       roughly half the width in slack, and the off-axis shapes (cone, line, cube) sitting off
       centre in their own frame. Filling a pixel window instead makes the drawn field an actual
       rectangle and stops the surplus width scaling the art down. */
    var cx0 = [];
    all.forEach(function (c) { cx0.push(W * (c.q + c.r / 2)); });
    var lox = Math.min.apply(null, cx0) - W, hix = Math.max.apply(null, cx0) + W;
    var xs = [], ys = [], grid = [];
    for (var r = b.lo2; r <= b.hi2; r++) {
      var q0 = Math.ceil(lox / W - r / 2), q1 = Math.floor(hix / W - r / 2);
      for (var q = q0; q <= q1; q++) {
        var cx = W * (q + r / 2), cy = VS * r;
        grid.push({ q: q, r: r, cx: cx, cy: cy });
        xs.push(cx - W / 2); xs.push(cx + W / 2); ys.push(cy - HEXR); ys.push(cy + HEXR);
      }
    }
    var minX = Math.min.apply(null, xs), maxX = Math.max.apply(null, xs);
    var minY = Math.min.apply(null, ys), maxY = Math.max.apply(null, ys);
    // the plain field first, then the caught spaces over it: see the note in drawSquare
    var over = "";
    grid.forEach(function (g) {
      var on = !!hit[key(g.q, g.r)];
      var poly = '<polygon class="aoe-cell' + (on ? " aoe-hit" : "") + '" points="' + hexPoly(g.cx - minX, g.cy - minY, HEXR) + '"/>';
      if (on) over += poly; else s += poly;
    });
    s += over;
    s += originMark(0 - minX, 0 - minY, HEXR * 0.42);
    return wrapSvg(s, maxX - minX, maxY - minY, cells.length, shape, n);
  }

  function originMark(cx, cy, r) {
    return '<circle class="aoe-origin" cx="' + cx.toFixed(2) + '" cy="' + cy.toFixed(2) + '" r="' + r.toFixed(2) + '"/>';
  }

  function wrapSvg(inner, w, h, count, shape, n) {
    var info = shapeInfo(shape);
    var label = "Area " + n + (shape === "sphere" ? "" : " " + shape) + " on a " + _grid
      + " grid" + (aimed(shape) ? ", facing " + facingName() : "")
      + ", " + count + (count === 1 ? " space" : " spaces");
    return '<svg class="aoe-svg" viewBox="0 0 ' + Math.ceil(w) + " " + Math.ceil(h) + '" xmlns="http://www.w3.org/2000/svg"'
      + ' role="img" aria-label="' + label + '"><title>' + label + ", " + info.name + '</title>' + inner + "</svg>";
  }

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
  function build() {
    if (!EN.basics || !EN.basics.space) return null;
    var list = shapeList();
    if (!list.length) return null;

    var box = el("div.aoe-box");
    var note = el("p.help.aoe-note", { style: { margin: "6px 0 0" } });

    function draw() {
      clear(box);
      var n = clampSize(_size);
      var info = shapeInfo(_shape);
      box.appendChild(el("div", { html: _grid === "hex" ? drawHex(_shape, n) : drawSquare(_shape, n) }));
      facingRow.style.display = aimed(_shape) ? "" : "none";
      facingOut.textContent = facingName();
      var txt = info.text;
      if (_grid === "hex" && _shape === "cube") {
        txt += " The Handbook calls this a square zone and gives no hex version, so it is drawn here as "
          + n + " rows of " + n + ".";
      }
      note.textContent = txt;
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

    /* FACING, shown only for the two shapes the book aims rather than places. Two step buttons
       rather than a compass of fixed points, because the number of directions is a property of
       the grid: four on square, six on hex. Stepping wraps, so one control fits both without
       going stale when the grid changes under it. */
    var facingOut = el("span.mono", { style: { fontSize: "11px", letterSpacing: ".14em", color: "var(--accent)", minWidth: "34px", textAlign: "center" } });
    function turn(by, label, title) {
      return el("button.chip", { type: "button", title: title, style: { cursor: "pointer" },
        onclick: function () { _facing = facing() + by; draw(); } }, label);
    }
    var facingRow = el("div.row", { style: { gap: "6px", alignItems: "center", marginBottom: "10px" } }, [
      el("span", { style: { fontFamily: "var(--mono)", fontSize: "9px", letterSpacing: ".18em", color: "var(--text3)" }, text: "FACING" }),
      turn(-1, "\u21ba", "Turn left"),
      facingOut,
      turn(1, "\u21bb", "Turn right")
    ]);

    var controls = el("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" } }, [
      ctlField("SHAPE", shapeSel),
      ctlField("SIZE IN SPACES", sizeIn)
    ]);

    draw();
    return el("div.aoe-widget", null, [
      el("div.row.between.wrap", { style: { gap: "10px", marginBottom: "8px", alignItems: "center" } }, [
        el("span.mono", { style: { fontSize: "10px", letterSpacing: ".18em", color: "var(--text3)" }, text: "// TEMPLATE" }),
        gridRow
      ]),
      controls,
      facingRow,
      box,
      note,
      el("p.help", { style: { margin: "6px 0 0", fontStyle: "italic" },
        text: "The shapes and their sizes are the Handbook's. How the grid counts them is this diagram's own convention: a space is in or out by its center, and distance runs straight between centers. A Sphere or Aura of X takes every space whose center is within X and a half of its point, so it is round. A Cone is a triangle from you, X long and X across at its far end, the same on both sides of its heading; an even-sized Cone is drawn one space wider at its far end, since an even row cannot sit centered on its heading. A Line takes the spaces whose centers lie within half a space of its path. Cone, Line and Aura start on you; Sphere and Cube are placed on a point you can see, the Cube centered on it. Facing turns in quarters on a square grid and in sixths on a hex one." })
    ]);
  }

  /* The geometry, for the Flow tab's Visualize window (js/flowviz.js): the same cells the Codex diagram
     draws, so the two can never disagree about what a Sphere or a Cone catches. Origin 0,0, facing east. */
  return { build: build, sqCells: sqCells, hexCells: hexCells, cellsAt: cellsAt, centreOf: centreOf, roundDist: roundDist };
})();
