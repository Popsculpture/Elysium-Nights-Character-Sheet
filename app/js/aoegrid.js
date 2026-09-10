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
   than letting a picture pass for a ruling:
     1. Diagonals. The word never appears in Part 2. Distance here is counted
        the way "X spaces away" reads most plainly: a diagonal step costs 1,
        so a sphere of radius X is a square of side 2X+1. If the book ever
        adopts an alternating 1-2-1 rule, sqDist below is the one line to
        change.
     2. Hex distance. Not stated either. Standard axial distance is used.
     3. Cone widening. The book fixes the widest point at X and gives no angle
        and no rate, so this widens one space per space of length: at distance
        d the wedge is d spaces across, reaching exactly X at distance X. That
        is the reading that makes "Area 3 cone" a triangle three long and
        three wide, which is what the Flow chapter's "triangular burst" shows.
        One consequence worth knowing rather than puzzling over: a row of EVEN
        width cannot be centred on a row of a square grid, so an even-sized
        square cone leans half a space to one side. It alternates rather than
        drifts, so the cone stays on its axis; the hex wedge has no such
        problem and comes out a clean 60 degree triangle at every size.
     4. Corner clipping. No rule for a space caught only at its corner, so
        membership here is whole spaces by centre.
     5. Cube on hex. The book calls a Cube a "square zone" and never gives it
        a hex equivalent, so on hex it is drawn as X rows of X and labelled an
        approximation.

   Origin. Sphere and Cube anchor on a point you pick; Cone, Line and Aura
   originate on you. The marker shows which, and Cube anchors its near corner
   on the marked space, since the book places it "on a point", not centered.

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

  /* WHY THE TWO GRIDS TURN BY DIFFERENT AMOUNTS. Rotation here is an exact lattice turn, never
     an approximation: a quarter turn on a square grid maps (x,y) to (-y,x), and a sixth turn on
     a pointy-top hex maps axial (q,r) to (-r,q+r). Both send whole cells onto whole cells, so a
     rotated cone keeps every property the unrotated one has, including the one number the book
     actually fixes: its widest point is still exactly X.

     That is also why a square grid stops at four facings rather than eight. A diagonal is not a
     lattice rotation of a square grid, and with this diagram's counting convention (a diagonal
     step costs 1, so distance is Chebyshev) the ring at distance d turns a corner on the
     diagonal: the cells that would make a diagonal cone come out as an L bent round that corner
     rather than a triangle, and its widest row is no longer X. Offering it would mean either
     drawing a shape the rule does not describe or quietly breaking the book's own number. Four
     honest facings beat eight approximate ones on a page whose whole job is to be a reference. */
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

  /* ---- square geometry. Origin cell is 0,0 and facing is +x (to the right). */
  function sqDist(x, y) { return Math.max(Math.abs(x), Math.abs(y)); }   // diagonals cost 1 (see header)
  function sqCells(shape, n) {
    var out = [], x, y, d, lo, hi;
    if (shape === "sphere" || shape === "aura") {
      for (x = -n; x <= n; x++) for (y = -n; y <= n; y++) if (sqDist(x, y) <= n) out.push({ x: x, y: y });
    } else if (shape === "cube") {
      // X spaces on each edge, near corner anchored on the marked space
      for (x = 0; x < n; x++) for (y = 0; y < n; y++) out.push({ x: x, y: y });
    } else if (shape === "line") {
      for (x = 1; x <= n; x++) out.push({ x: x, y: 0 });
    } else {   // cone: at distance d the wedge is d across, so it reaches exactly n at distance n
      for (d = 1; d <= n; d++) {
        lo = -Math.floor((d - 1) / 2); hi = Math.floor(d / 2);
        for (y = lo; y <= hi; y++) out.push({ x: d, y: y });
      }
    }
    return out;
  }

  /* ---- hex geometry, pointy top, axial q,r. Origin is 0,0 and facing is east. */
  function hexDist(q, r) { return (Math.abs(q) + Math.abs(q + r) + Math.abs(r)) / 2; }
  function hexCells(shape, n) {
    var out = [], q, r, a, b, d;
    if (shape === "sphere" || shape === "aura") {
      for (q = -n; q <= n; q++) for (r = -n; r <= n; r++) if (hexDist(q, r) <= n) out.push({ q: q, r: r });
    } else if (shape === "cube") {
      // the book gives no hex Cube; drawn as n rows of n, labelled an approximation
      for (r = 0; r < n; r++) for (a = 0; a < n; a++) out.push({ q: a - Math.floor(r / 2), r: r });
    } else if (shape === "line") {
      for (q = 1; q <= n; q++) out.push({ q: q, r: 0 });
    } else {   // cone: the 60 degree wedge between east and north-east, d hexes at distance d
      for (d = 1; d <= n; d++) {
        for (a = 1; a <= d; a++) { b = d - a; out.push({ q: a + b, r: -b }); }
      }
    }
    return out;
  }

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
        txt += " The book calls this a square zone and gives no hex version, so it is drawn here as "
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
        text: "The shapes and their sizes are the book's. How the grid counts them is this diagram's own convention: a diagonal step costs 1 space, a cone widens one space per space and reaches its stated width at the far edge, and a space is in or out by its center. Cone, Line and Aura start on you; Sphere and Cube are placed on a point you can see. Facing turns in quarters on a square grid and in sixths on a hex one, since those are the turns that land whole spaces on whole spaces and keep a cone exactly its stated width." })
    ]);
  }

  return { build: build };
})();
