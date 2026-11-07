/* ===========================================================================
   ELYSIUM NIGHTS · Flow tab · Visualize window
   A pop-open window that DRAWS the Invocation being free-shaped: you at the centre of a grid,
   the reach, and the Delivery's area at the size you have bought, in the Resonance's colour.
   Change anything in the builder (or in the window's own controls, which are the same controls)
   and the picture reshapes on the spot.

   What it draws is the book's, taken from the one place the app already settles it:
     EN.aoeGrid (js/aoegrid.js) owns the cell geometry (Sphere, Cube, Cone, Line, Aura on a
     square or hex grid, membership by centre and straight-line distance), so this window and the
     Codex's Area diagram can never disagree about what a Sphere or a Cone catches. A Cube is
     centred on its point, as the Codex diagram draws it.
     EN.flow.deliveryTable owns the reach and size of each Delivery (Handbook, The Flow >
     Invocations): Remote, Cube and Sphere reach 12 spaces; Touch is a target you touch; Sigil is
     a mark within your reach and fires "centered on the mark"; Aura, Cone and Line start on you.
     Each extra space bought (+1 FP) grows one dimension: a radius, a widest point, a length or an
     edge. Each extra target bought for a Directed Delivery is another target of the same kind:
     beside you for Touch and Imbue, within 12 spaces for Remote.
   The shapes follow aoegrid.js (the author's ruling, 3 Nov 2026): a space is in when its centre is,
   so Spheres and Auras are round, Cones are symmetric triangles, and Lines run along any heading.
   "Within X spaces" is read the same way, the centre within X and a half, so the reach is a circle.
   Conventions this window CHOOSES (the book leaves them open, as aoegrid.js says of its own):
     a placed point starts 6 spaces out on your facing line; your reach is the spaces beside
     you, which is where Touch targets, Imbued objects and a Sigil's mark go; a Cube is centred
     on its point; which spaces the sample foes and spared allies stand on.
   Aim: a Remote target, a Sphere or a Cube can stand anywhere within 12 spaces and a Sigil's
   mark on any space beside you; tap or drag on the map to put it there, or use the arrows (one
   space) and the turn buttons (it orbits you). A Cone or a Line turns through eight headings on
   a square grid and six on hex: the turn buttons, or tap or drag the way it should face. The
   line of sight runs from you to the middle of what you placed, as centred as the grid allows.
   Navigating (3 Nov 2026): the wheel, or a pinch on a touchpad or a touch screen, zooms about the
   pointer; a long press and drag, or the middle button held, pans; a plain drag pans when the
   Delivery has nothing to place. Any of these takes the view off FIT until FIT is pressed.
   The view: centred on you for Touch, Imbue, Sigil, Aura, Cone and Line, and on the action for
   Remote, Cube and Sphere; it zooms itself to fit you and everything the Invocation touches
   (the area, its targets, its point), never narrower than 9 spaces. The - FIT + buttons
   zoom by hand; a hand zoom holds while you keep shaping the same Delivery, and FIT, a new Delivery
   or closing the window goes back to fitting. A reach too long for the view is named in the key
   rather than forcing the view out to it. The key and the zoom buttons sit in a bar UNDER the
   map, never on it, so nothing the fit shows is ever covered.

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
  var _zoom = null;        // null = fit to the Invocation; a number = the half-width of the view in spaces, set by hand
  var _zoomFor = null;     // the Delivery the hand zoom was set on; another Delivery fits again
  var _lastFit = 8;        // the half-width the last fit came to (the hand zoom starts from it)
  var _lastHalf = 8;       // the half-width last drawn (for the zoom buttons' limits)
  var _lastView = null;    // the view last drawn {cx, cy, hw, hh}; a drag holds it still
  var _dragView = null;    // set while a drag is placing something
  var _viewC = null;       // a view centre set by hand (pan, pinch, wheel), in spaces; null = the focus
  var _gest = null;        // the gesture on the map: pending (a press), place, pan or pinch
  var _ptrs = {};          // the pointers down on the map, by id (two of them pinch)
  var _raf = 0;            // a redraw already asked for this frame
  var _lastScene = null;   // the scene last drawn (the map's pointer handler reads its Delivery)
  /* the aim, kept while the window is open and across closing it; a grid change starts it fresh:
     point = where a Remote target, Sphere or Cube stands; mark = a Sigil's mark; turn = a Cone's or Line's heading */
  var _aim = { point: null, mark: null, turn: 0 };
  try { if (localStorage.getItem(GRID_KEY) === "hex") _grid = "hex"; } catch (e) {}
  try { _imm = localStorage.getItem(IMM_KEY) === "1"; } catch (e) {}

  /* SVG units: one space is C across, you are at 0,0. The view is centred on you for the Deliveries that
     start on you or beside you, and on the action for those placed out in the world (ACTION below);
     its height is ASPECT of its width. */
  var C = 20, RANGE = 12, ASPECT = 0.75;
  var MIN_HALF = 4.5, MAX_HALF = 30, ZOOM_IN_MIN = 2.5, ZOOM_STEP = 1.35;
  var SQ3 = Math.sqrt(3), HEXR = C / SQ3;
  var ACTION = { remote: 1, cube: 1, sphere: 1 };   // the view centres on the action, not on you
  var MOVABLE = { remote: 1, cube: 1, sphere: 1, sigil: 1 };   // a point you place (Sigil: a mark within reach)
  var AIMED = { cone: 1, line: 1 };                  // a heading you turn

  /* one colour per Resonance (a hex, because an SVG fill in a style string needs a literal) */
  /* The Resonance colours (the author, 7 Nov 2026): Kinetic steel silver, Thermal magma orange, Electromagnetic
     cyan, Visceral blood red, Synthetica neon green, Spatial deep violet, Cognitive hot pink, Temporal yellow.
     Both decks and the map read them through resColor. */
  var RES = { kinetic: "#c3cedf", thermal: "#ff7b2c", electromagnetic: "#00f0ff", visceral: "#ff1000",
              spatial: "#9400ba", cognitive: "#ff05b1", synthetica: "#39ff6a", temporal: "#ffe600" };
  function resColor(key) { return RES[key] || RES.kinetic; }

  /* ---- grid geometry (aoegrid.js owns it: membership by centre, straight-line distance) ------- */
  function G() { return EN.aoeGrid || null; }
  function cell(a, b) { return _grid === "hex" ? { q: a, r: b } : { x: a, y: b }; }
  function add(c, a, b) { return _grid === "hex" ? { q: c.q + a, r: c.r + b } : { x: c.x + a, y: c.y + b }; }
  function delta(c) { return _grid === "hex" ? [c.q, c.r] : [c.x, c.y]; }
  function ck(c) { return _grid === "hex" ? c.q + ":" + c.r : c.x + ":" + c.y; }
  function isOrigin(c) { return _grid === "hex" ? (c.q === 0 && c.r === 0) : (c.x === 0 && c.y === 0); }
  function sp(c) { return G().centreOf(_grid, c); }                         // a space's centre, in spaces
  function pt(c) { var p = sp(c); return { x: p.x * C, y: p.y * C }; }      // and in SVG units
  function dist(c) { return G().roundDist(_grid, c); }
  // "within X spaces": the centre within X and a half (the same reading as a Sphere's X)
  function within(c, X) { return !isOrigin(c) && dist(c) <= X + 0.5 + 1e-6; }
  // the space whose centre is nearest a point given in spaces
  function cellAt(x, y) {
    if (_grid !== "hex") return cell(Math.round(x), Math.round(y));
    var rf = y / (SQ3 / 2), qf = x - rf / 2, sf = -qf - rf;
    var q = Math.round(qf), r = Math.round(rf), s = Math.round(sf);
    var dq = Math.abs(q - qf), dr = Math.abs(r - rf), ds = Math.abs(s - sf);
    if (dq > dr && dq > ds) q = -r - s; else if (dr > ds) r = -q - s;
    return cell(q, r);
  }
  // the spaces beside you: your reach (Touch targets, Imbued objects, a Sigil's mark), nearest your facing first
  function beside() {
    return (_grid === "hex"
      ? [[1, 0], [1, -1], [0, 1], [0, -1], [-1, 1], [-1, 0]]
      : [[1, 0], [1, -1], [1, 1], [0, -1], [0, 1], [-1, -1], [-1, 1], [-1, 0]]).map(function (p) { return cell(p[0], p[1]); });
  }
  function centroid(cells) {
    var x = 0, y = 0; cells.forEach(function (c) { var p = sp(c); x += p.x; y += p.y; });
    return cells.length ? { x: x / cells.length, y: y / cells.length } : { x: 0, y: 0 };
  }

  /* ---- aim: where a placed point stands and which way an aimed shape faces ----------------- */
  // headings: eight on a square grid (45 degrees), six on hex (60), clockwise from east (y runs down)
  var SQ_DIRS = ["E", "SE", "S", "SW", "W", "NW", "N", "NE"], HEX_DIRS = ["E", "SE", "SW", "W", "NW", "NE"];
  function dirs() { return _grid === "hex" ? HEX_DIRS : SQ_DIRS; }
  function stepDeg() { return 360 / dirs().length; }
  function turnNow() { var n = dirs().length; return ((_aim.turn % n) + n) % n; }
  function headingDeg() { return turnNow() * stepDeg(); }
  // the point (Remote, Sphere, Cube): any space within 12 of you; it starts 6 out on your facing line
  function pointNow() { var p = _aim.point || cell(6, 0); return within(p, RANGE) ? p : cell(6, 0); }
  // the Sigil's mark: a space beside you
  function markNow() { var m = _aim.mark || cell(1, 0); return within(m, 1) ? m : cell(1, 0); }
  // the nearest space within X along the line from you to (x,y), in spaces (a click past the reach lands at its edge)
  function clampTo(x, y, X) {
    var d = Math.sqrt(x * x + y * y);
    if (d < 1e-6) return null;
    var k = Math.min(1, (X + 0.45) / d), c = cellAt(x * k, y * k), guard = 0;
    while (!within(c, X) && guard++ < 40) { k *= 0.94; c = cellAt(x * k, y * k); if (isOrigin(c)) return null; }
    return within(c, X) ? c : null;
  }
  // the beside-you space nearest a direction
  function besideToward(x, y) {
    var a = Math.atan2(y, x), best = null, bd = Infinity;
    beside().forEach(function (c) { var p = sp(c), d0 = Math.abs(Math.atan2(Math.sin(Math.atan2(p.y, p.x) - a), Math.cos(Math.atan2(p.y, p.x) - a))); if (d0 < bd - 1e-6) { bd = d0; best = c; } });
    return best;
  }
  function setPoint(key, c, orbiting) {
    if (!c) return false;
    if (!orbiting) _aim.orbit = null;   // only the turn buttons keep the exact circle they are walking
    if (key === "sigil") { if (!within(c, 1)) return false; if (_aim.mark && ck(_aim.mark) === ck(c)) return false; _aim.mark = c; return true; }
    if (!within(c, RANGE)) return false;
    if (_aim.point && ck(_aim.point) === ck(c)) return false;
    _aim.point = c; return true;
  }
  /* Place by a map position in spaces (a tap or a drag): a point lands on that space (pulled in to
     the reach if it is past it), a mark on the beside-you space that way, a heading the nearest one. */
  function aimAt(key, x, y) {
    if (AIMED[key]) {
      if (Math.abs(x) < 1e-6 && Math.abs(y) < 1e-6) return false;
      var n = dirs().length, t = Math.round(Math.atan2(y, x) * 180 / Math.PI / stepDeg());
      t = ((t % n) + n) % n;
      if (t === turnNow()) return false;
      _aim.turn = t; return true;
    }
    if (key === "sigil") return setPoint(key, within(cellAt(x, y), 1) ? cellAt(x, y) : besideToward(x, y));
    return setPoint(key, clampTo(x, y, RANGE));
  }
  /* one space in a screen direction. On hex the rows above and below sit half a space either side,
     so up and down zigzag: from an even row to the right-hand space, from an odd row to the left-hand
     one, which keeps a run of presses on one column and makes up then down come home. When the
     first choice is refused (you, or past the reach) the other space in that row is tried. */
  function nudge(key, dir) {
    var cur = key === "sigil" ? markNow() : pointNow(), X = key === "sigil" ? 1 : RANGE, opts;
    if (_grid !== "hex") opts = { left: [[-1, 0]], right: [[1, 0]], up: [[0, -1]], down: [[0, 1]] }[dir];
    else {
      var odd = ((cur.r % 2) + 2) % 2 === 1;
      opts = { left: [[-1, 0]], right: [[1, 0]], up: odd ? [[0, -1], [1, -1]] : [[1, -1], [0, -1]], down: odd ? [[-1, 1], [0, 1]] : [[0, 1], [-1, 1]] }[dir];
    }
    for (var i = 0; i < opts.length; i++) { var c = add(cur, opts[i][0], opts[i][1]); if (within(c, X)) return setPoint(key, c); }
    return false;
  }
  // turn: an aimed shape turns one heading; a placed point orbits you by the same step, keeping its distance
  function turnBy(key, k) {
    if (AIMED[key]) { _aim.turn = turnNow() + k; return true; }
    if (key === "sigil") {
      var ring = beside().slice().sort(function (a, b) { return Math.atan2(sp(a).y, sp(a).x) - Math.atan2(sp(b).y, sp(b).x); });
      var i = ring.map(ck).indexOf(ck(markNow()));
      return setPoint(key, ring[((i + k) % ring.length + ring.length) % ring.length]);
    }
    /* the point walks an exact circle (kept until it is placed any other way), so turns keep its
       distance and undo each other; each step lands on the space near the true position whose
       distance from you is closest to the circle's */
    if (!_aim.orbit) { var p0 = sp(pointNow()); _aim.orbit = { d: Math.sqrt(p0.x * p0.x + p0.y * p0.y), a: Math.atan2(p0.y, p0.x) }; }
    var o = _aim.orbit; o.a += k * stepDeg() * Math.PI / 180;
    var ex = o.d * Math.cos(o.a), ey = o.d * Math.sin(o.a), c0 = cellAt(ex, ey), best = null, bs = Infinity;
    var near = [c0].concat((_grid === "hex" ? [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]] : [[1, 0], [1, -1], [0, -1], [-1, -1], [-1, 0], [-1, 1], [0, 1], [1, 1]]).map(function (q) { return add(c0, q[0], q[1]); }));
    near.forEach(function (c) {
      if (!within(c, RANGE)) return;
      var p = sp(c), score = Math.abs(dist(c) - o.d) + 0.5 * Math.sqrt((p.x - ex) * (p.x - ex) + (p.y - ey) * (p.y - ey));
      if (score < bs - 1e-6) { bs = score; best = c; }
    });
    return setPoint(key, best, true);
  }
  function resetAim(key) { _aim.orbit = null; if (AIMED[key]) _aim.turn = 0; else if (key === "sigil") _aim.mark = null; else _aim.point = null; }

  /* Delivery option label ("Cube (2 spaces)") -> its key and the size the book gives it; extra spaces
     bought grow it one for one */
  var BASE_SIZE = { cube: 2, sigil: 2, aura: 2, cone: 3, sphere: 3, line: 6 };
  var SHAPE_OF = { cube: "cube", sigil: "cube", aura: "aura", cone: "cone", sphere: "sphere", line: "line" };
  function optKey(opt) { return String(opt || "").replace(/ \([^)]*\)$/, "").toLowerCase(); }
  function spaces(n) { return n + " space" + (n === 1 ? "" : "s"); }
  function outText(c) { return spaces(Math.round(dist(c))) + " out"; }   // whole spaces, the reading "within" uses
  /* where a Remote Invocation's targets stand: the first on the point, then every other space within 12
     of you (never on you), nearest the first one first, so they cluster round it and only a reach
     that is genuinely full leaves any unplaced */
  function remoteSpots(first) {
    var fp = sp(first), out = [], a, b, B = RANGE + 2;
    for (a = -B - 8; a <= B + 8; a++) for (b = -B; b <= B; b++) {
      var c = cell(a, b);
      if (!within(c, RANGE) || ck(c) === ck(first)) continue;
      var p = sp(c); out.push({ c: c, k: (p.x - fp.x) * (p.x - fp.x) + (p.y - fp.y) * (p.y - fp.y), ay: Math.abs(p.y - fp.y), x: -p.x });
    }
    out.sort(function (u, v) { return (u.k - v.k) || (u.ay - v.ay) || (u.x - v.x); });
    return [first].concat(out.map(function (o) { return o.c; }));
  }

  /* Build the whole scene: the cells caught, the targets, the reach, the focus, the fit and the words */
  function scene(form, inv, d) {
    var key = optKey(form.deliveryOption), band = form.deliveryBand;
    var fMod = (d && d.flow && d.flow.attribute && d.attributes[d.flow.attribute]) ? d.attributes[d.flow.attribute].mod : 0;
    var S = { key: key, band: band, area: [], foes: [], allies: [], objects: [], spared: {}, range: 0, anchor: null, size: 0, shape: null, text: "", where: "", unplaced: 0,
              focus: { x: 0, y: 0 }, sights: [], heading: null };
    var ex = Math.max(0, form.extraSpaces | 0), et = Math.max(0, form.extraTargets | 0);
    if (band === "directed") {
      var want = 1 + et, spots;
      if (key === "touch") { S.range = 1; spots = beside(); S.where = "a target you touch, beside you"; }
      else if (key === "imbue") { S.range = 1; spots = beside(); S.where = "an object or weapon within your reach; waits up to 1 minute"; }
      else { S.range = RANGE; spots = remoteSpots(pointNow()); S.where = "a target you can clearly see within " + RANGE + " spaces, " + outText(pointNow()); }
      var placed = spots.slice(0, want);
      S.unplaced = want - placed.length;
      if (key === "imbue") S.objects = placed; else S.foes = placed;
      // a line of sight to each target out in the world; Touch and Imbue are beside you
      if (key === "remote") { S.sights = placed.map(sp); S.focus = centroid(placed); }
      S.text = (key === "touch" ? "Touch" : key === "imbue" ? "Imbue" : "Remote") + ": " + (key === "imbue" ? "one object" : "one target") + (et ? " and " + et + " more" : "");
      fit(S); return S;
    }
    var n = (BASE_SIZE[key] || 2) + ex, shape = SHAPE_OF[key] || "sphere";
    S.size = n; S.shape = shape;
    if (key === "sphere" || key === "cube") {
      var P = pointNow(), dp = delta(P);
      S.anchor = P; S.range = RANGE;
      S.area = G().cellsAt(_grid, shape, n, 0).map(function (c) { return add(c, dp[0], dp[1]); });
      S.where = "centred on a point you can see within " + RANGE + " spaces, " + outText(P);
    } else if (key === "sigil") {
      var M = markNow(), dm = delta(M), rel = G().cellsAt(_grid, "cube", n, 0);
      S.anchor = M; S.range = 1;
      /* an even cube leans half a space one way off its mark; when that lean would put it over you,
         the same cube turned about the mark (a mirror on square, a sixth turn on hex) is used instead,
         so a mark beside you never lays its trap on your own space when it need not */
      var turns = _grid === "hex"
        ? [0, 1, 2, 3, 4, 5].map(function (k) { return rel.map(function (c) { var q = c.q, r = c.r; for (var i = 0; i < k; i++) { var nq = -r; r = q + r; q = nq; } return { q: q, r: r }; }); })
        : [[1, 1], [-1, 1], [1, -1], [-1, -1]].map(function (m) { return rel.map(function (c) { return { x: c.x * m[0], y: c.y * m[1] }; }); });
      var placedSigil = turns.map(function (t) { return t.map(function (c) { return add(c, dm[0], dm[1]); }); });
      S.area = placedSigil.filter(function (cs) { return !cs.some(isOrigin); })[0] || placedSigil[0];
      S.where = "centred on a mark within your reach; waits up to 1 minute";
    } else if (key === "aura") {
      S.area = G().cellsAt(_grid, "aura", n, 0);
      S.where = "on you; it moves with you";
    } else {
      S.heading = dirs()[turnNow()];
      S.area = G().cellsAt(_grid, shape, n, headingDeg());
      var diag = _grid !== "hex" && turnNow() % 2 === 1;
      S.where = (key === "cone" ? "from you, widest point " + spaces(n) + " across" + (n % 2 === 0 && !diag ? " (drawn " + (n + 1) + " at its far end: an even row cannot sit centred on its heading)" : "")
        : "from you, " + spaces(n) + " long, 1 wide") + ", facing " + S.heading;
    }
    // the line of sight runs to the middle of what you placed: as centred as the grid allows
    if (S.anchor) { var mid = centroid(S.area); S.sights = [mid]; if (ACTION[key]) S.focus = mid; }
    // sample foes and (with Precision Shaping) the allies it spares, spread through the area
    var cells = S.area.filter(function (c) { return !isOrigin(c) && !(S.anchor && ck(c) === ck(S.anchor)); });   // never on you, the point or the mark
    var m = cells.length, used = {};
    function pick(frac) { var i = Math.min(m - 1, Math.max(0, Math.floor(m * frac))); while (used[i] && i < m - 1) i++; while (used[i] && i > 0) i--; used[i] = 1; return cells[i]; }
    if (m) {
      var prec = !!(form.precision && (band === "focused" || band === "wide"));
      // with Precision Shaping on, a small area still keeps a space for a spared ally to show
      var maxFoes = Math.min(3, m - (prec && fMod > 0 && m > 1 ? 1 : 0));
      [0.12, 0.5, 0.86].forEach(function (f) { if (S.foes.length < maxFoes) S.foes.push(pick(f)); });
      var spare = prec ? Math.max(0, Math.min(fMod, 5, m - S.foes.length)) : 0;
      var fr = [0.3, 0.66, 0.92, 0.2, 0.78];
      for (var k = 0; k < spare; k++) { var c = pick(fr[k % fr.length]); S.allies.push(c); S.spared[ck(c)] = 1; }
    }
    S.text = shape.charAt(0).toUpperCase() + shape.slice(1) + " (Area " + n + "): " + S.area.length + " spaces";
    fit(S); return S;
  }
  /* The fit: the smallest view around the focus (you, or the action) that holds you and everything the
     Invocation touches with half a space to spare, at least 9 spaces across, ASPECT high */
  function fit(S) {
    var fx = S.focus.x, fy = S.focus.y, mx = 0, my = 0;
    S.area.concat(S.foes, S.allies, S.objects, S.anchor ? [S.anchor] : [], [cell(0, 0)]).forEach(function (c) {
      var p = sp(c); mx = Math.max(mx, Math.abs(p.x - fx)); my = Math.max(my, Math.abs(p.y - fy));
    });
    var hw = Math.max(MIN_HALF, mx + 1), hh = my + 1;
    if (hh > hw * ASPECT) hw = hh / ASPECT;
    S.fitHalf = Math.min(MAX_HALF, hw);
  }

  /* ---- drawing ------------------------------------------------------------------------------ */
  function cellShape(c, cls, extra) {
    var p = pt(c);
    if (_grid === "hex") {
      var s = [], i, a;
      for (i = 0; i < 6; i++) { a = Math.PI / 180 * (60 * i - 30); s.push((p.x + (HEXR - 0.6) * Math.cos(a)).toFixed(1) + "," + (p.y + (HEXR - 0.6) * Math.sin(a)).toFixed(1)); }
      return '<polygon class="' + cls + '" points="' + s.join(" ") + '"' + (extra || "") + '/>';
    }
    return '<rect class="' + cls + '" x="' + (p.x - C / 2) + '" y="' + (p.y - C / 2) + '" width="' + C + '" height="' + C + '"' + (extra || "") + '/>';
  }
  function token(c, cls, glyph) {
    var p = pt(c);
    return '<g class="fv-tok ' + cls + '" transform="translate(' + p.x.toFixed(1) + " " + p.y.toFixed(1) + ')"><circle r="' + (C * 0.36) + '"/>' + (glyph || "") + '</g>';
  }
  // every space in the view V (centre cx,cy and half sizes hw,hh, all in spaces), in paint order
  function boardCells(V) {
    var out = [], a, b;
    // a space is in view when any of it shows (half a space across; a hex is taller, its circumradius)
    var ry = _grid === "hex" ? 1 / SQ3 : 0.5;
    function inView(c) { var p = sp(c); return Math.abs(p.x - V.cx) < V.hw + 0.5 - 0.0005 && Math.abs(p.y - V.cy) < V.hh + ry - 0.0005; }
    if (_grid === "hex") {
      var r0 = Math.floor((V.cy - V.hh) / (SQ3 / 2)) - 1, r1 = Math.ceil((V.cy + V.hh) / (SQ3 / 2)) + 1;
      for (b = r0; b <= r1; b++) for (a = Math.floor(V.cx - V.hw - b / 2) - 1; a <= Math.ceil(V.cx + V.hw - b / 2) + 1; a++) { var h = { q: a, r: b }; if (inView(h)) out.push(h); }
    } else {
      for (a = Math.floor(V.cx - V.hw) - 1; a <= Math.ceil(V.cx + V.hw) + 1; a++) for (b = Math.floor(V.cy - V.hh) - 1; b <= Math.ceil(V.cy + V.hh) + 1; b++) { var s = { x: a, y: b }; if (inView(s)) out.push(s); }
    }
    out.inView = inView;
    // a token is drawn when any of its circle shows
    out.tokenInView = function (c) { var p = sp(c), r = 0.36; return Math.abs(p.x - V.cx) < V.hw + r && Math.abs(p.y - V.cy) < V.hh + r; };
    return out;
  }
  // the view: a hand zoom or the fit, around the focus; frozen while a drag is placing something
  function viewFor(S) {
    if (_dragView) return _dragView;
    var hw = _zoom != null ? _zoom : S.fitHalf, c = _viewC || S.focus;
    return { cx: c.x, cy: c.y, hw: hw, hh: hw * ASPECT };
  }
  function draw(form, inv, d, S) {
    var forKey = (form.deliveryBand || "") + "|" + S.key;
    if ((_zoom != null || _viewC) && _zoomFor !== forKey) { _zoom = null; _viewC = null; }   // a new Delivery fits itself
    _zoomFor = forKey;
    var V = viewFor(S), hw = V.hw;
    _lastFit = S.fitHalf; _lastHalf = hw; _lastView = V;
    S.drawn = { foe: 0, ally: 0, obj: 0, zone: 0 };
    var board = boardCells(V), inView = board.inView, tokIn = board.tokenInView, hit = {}, svg = [];
    S.area.forEach(function (c) { hit[ck(c)] = 1; });
    var lay = inv && inv.layer;
    svg.push('<defs><pattern id="fv-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="none"/><line x1="0" y1="0" x2="0" y2="6" stroke="currentColor" stroke-width="2"/></pattern></defs>');
    var field = "", ranged = "", over = "";
    board.forEach(function (c) {
      if (hit[ck(c)]) return;
      if (S.range > 0 && within(c, S.range)) ranged += cellShape(c, "fv-cell fv-range"); else field += cellShape(c, "fv-cell");
    });
    svg.push(field, ranged);
    /* the area, over the field. Each space carries its distance from the area's source (--d) and the way back
       toward it (--ox, --oy), so the Immersive bloom runs outward from there: a placed shape (Sphere, Cube,
       Sigil) from its own middle, the rest (Aura, Cone, Line) from you */
    var src = S.anchor ? centroid(S.area) : { x: 0, y: 0 };
    var zone = inv && ((inv.empoweredEffect && inv.empoweredEffect.zone) || (inv.layer && inv.layer.empoweredEffect && inv.layer.empoweredEffect.zone));
    var sustain = form.duration === "sustain" && inv && inv.sustainable !== false;
    var caught = 0;
    S.area.forEach(function (c, i) {
      if (!S.spared[ck(c)]) caught++;
      if (!inView(c)) return;
      var cls = "fv-cell fv-hit" + (S.spared[ck(c)] ? " fv-spared" : "") + (lay && (i % 2 === 0) ? " fv-braid" : "");
      var sc = sp(c), dx = sc.x - src.x, dy = sc.y - src.y, r = Math.sqrt(dx * dx + dy * dy), k = r > 0.01 ? C * 0.6 / r : 0;
      over += cellShape(c, cls, ' style="--d:' + r.toFixed(2) + ";--ox:" + (-dx * k).toFixed(1) + ";--oy:" + (-dy * k).toFixed(1) + '"');
      if (zone && !S.spared[ck(c)]) { over += cellShape(c, "fv-zone"); S.drawn.zone++; }
    });
    S.caught = caught; S.zone = !!zone;
    svg.push('<g class="fv-area' + (sustain ? " fv-sustain" : "") + '">' + over + '</g>');
    // the reach: a circle round you, X and a half out (the same reading as "within X"); named in the key when it runs past the view
    if (S.range > 0) {
      var R = S.range + 0.5, corners = [[V.cx - hw, V.cy - V.hh], [V.cx + hw, V.cy - V.hh], [V.cx - hw, V.cy + V.hh], [V.cx + hw, V.cy + V.hh]];
      S.reachInView = !corners.every(function (k) { return Math.sqrt(k[0] * k[0] + k[1] * k[1]) < R; });
      svg.push('<circle class="fv-ring" cx="0" cy="0" r="' + (R * C).toFixed(1) + '"/>');
    }
    // lines of sight: from you to the middle of what you placed, or to each target out in the world
    S.sights.forEach(function (m) { svg.push('<line class="fv-beam" x1="0" y1="0" x2="' + (m.x * C).toFixed(1) + '" y2="' + (m.y * C).toFixed(1) + '"/>'); });
    if (S.key === "imbue" && S.objects[0]) { var ob = pt(S.objects[0]); svg.push('<line class="fv-beam" x1="0" y1="0" x2="' + ob.x + '" y2="' + ob.y + '"/>'); }
    // an aimed shape's heading, out to its far end
    if (S.heading) {
      var ha = headingDeg() * Math.PI / 180;
      // a square-grid Line counts a diagonal step as one space (aoegrid.js), so its far end is that much further out
      var stepK = (S.shape === "line" && _grid !== "hex") ? 1 / Math.max(Math.abs(Math.cos(ha)), Math.abs(Math.sin(ha))) : 1, L = (S.size + 0.5) * stepK * C;
      svg.push('<line class="fv-aim" x1="0" y1="0" x2="' + (Math.cos(ha) * L).toFixed(1) + '" y2="' + (Math.sin(ha) * L).toFixed(1) + '"/>');
    }
    if (S.anchor) { var ap = pt(S.anchor); svg.push('<g class="fv-anchor" transform="translate(' + ap.x + " " + ap.y + ')"><circle r="3.2"/><circle class="fv-anchor-ring" r="7"/></g>'); }
    S.objects.forEach(function (c) { if (tokIn(c)) { S.drawn.obj++; var op = pt(c); svg.push('<g class="fv-obj" transform="translate(' + op.x + " " + op.y + ')"><path d="M0,-7 L7,0 L0,7 L-7,0 Z"/></g>'); } });
    S.foes.forEach(function (c) { if (tokIn(c)) { S.drawn.foe++; svg.push(token(c, "fv-foe", '<path d="M-3.4,-3.4 L3.4,3.4 M3.4,-3.4 L-3.4,3.4"/>')); } });
    S.allies.forEach(function (c) { if (tokIn(c)) { S.drawn.ally++; svg.push(token(c, "fv-ally", '<path d="M-3.6,0.4 L-1,3 L3.8,-3"/>')); } });
    svg.push(token(cell(0, 0), "fv-you", '<circle class="fv-you-dot" r="3"/>'));
    // a wide view packs the spaces tight: its grid lines go fainter so the area still reads
    var dense = hw > 14 ? " fv-dense" : "", grab = (MOVABLE[S.key] || AIMED[S.key]) ? " fv-grab" : "";
    return '<svg class="fv-svg' + dense + grab + '" viewBox="' + ((V.cx - hw) * C).toFixed(1) + " " + ((V.cy - V.hh) * C).toFixed(1) + " " + (2 * hw * C).toFixed(1) + " " + (2 * V.hh * C).toFixed(1)
      + '" data-half="' + hw.toFixed(2) + '" data-cx="' + V.cx.toFixed(2) + '" data-cy="' + V.cy.toFixed(2) + '" role="img" aria-label="' + S.text.replace(/"/g, "") + '">' + svg.join("") + "</svg>";
  }

  /* ---- placing on the map: tap a space, or drag across it ------------------------------------
     A tap puts the point (or the Sigil's mark, or an aimed shape's heading) there; a drag keeps
     placing it as you move. While a drag is on, the view holds still under your finger; it fits
     again when you let go. The listeners sit on the document because the window is redrawn on
     every move. */
  function svgPoint(ev) {
    var svg = document.querySelector("#fv-win .fv-svg"); if (!svg || !svg.getScreenCTM) return null;
    var m = svg.getScreenCTM(); if (!m) return null;
    var p = svg.createSVGPoint(); p.x = ev.clientX; p.y = ev.clientY;
    var q = p.matrixTransform(m.inverse());
    return { x: q.x / C, y: q.y / C };
  }
  function placeFrom(ev) {
    var key = _lastScene && _lastScene.key, p = svgPoint(ev);
    if (!key || !p || !(MOVABLE[key] || AIMED[key])) return;
    if (aimAt(key, p.x, p.y) && _last) refresh(_last);
  }
  /* The gestures. One handler for mouse, pen and touch:
       a quick tap        places (the point, the mark or the heading), when the Delivery has one;
       a drag             places as it goes (the view holds still), or pans when there is nothing to place;
       a long press, drag pans (touch screens and touchpads: hold still for LONG_MS first);
       two fingers        pinch: zoom about their middle, and pan with it;
       the middle button  pans while held;
       the wheel          zooms about the pointer (a touchpad pinch arrives as a wheel with ctrlKey).
     The document carries the move and release listeners (bound once, below), because the window is
     redrawn while a gesture runs; redraws during a pan or a pinch are held to one every 16 ms. */
  var LONG_MS = 450, SLOP = 6;
  function liveRefresh() {
    // a timer rather than requestAnimationFrame: a frame callback never comes for a page that is not painting
    if (_raf) return;
    _raf = setTimeout(function () { _raf = 0; if (_last) refresh(_last); }, 16);
  }
  function stageRect() { var svg = document.querySelector("#fv-win .fv-svg"); return svg ? svg.getBoundingClientRect() : null; }
  // spaces per screen pixel in a view (the map letterboxes, so the larger of the two ratios)
  function upp(V, r) { return Math.max(2 * V.hw / Math.max(1, r.width), 2 * V.hh / Math.max(1, r.height)); }
  function worldAt(V, r, sx, sy) { var u = upp(V, r); return { x: V.cx + (sx - (r.left + r.width / 2)) * u, y: V.cy + (sy - (r.top + r.height / 2)) * u }; }
  function clampHalf(h) { return Math.max(ZOOM_IN_MIN, Math.min(MAX_HALF, h)); }
  function setView(cx, cy, hw) { _zoom = clampHalf(hw); _viewC = { x: cx, y: cy }; }
  function zoomAt(sx, sy, f) {
    var V = _lastView, r = stageRect(); if (!V || !r) return;
    var w = worldAt(V, r, sx, sy), hw = clampHalf(V.hw * f), k = hw / V.hw;
    setView(w.x - (w.x - V.cx) * k, w.y - (w.y - V.cy) * k, hw);
    // a pan or a pinch already running carries on from the zoomed view, so its next move does not undo the wheel
    var g = _gest, NV = { cx: _viewC.x, cy: _viewC.y, hw: _zoom, hh: _zoom * ASPECT };
    if (g && g.mode === "pan" && _ptrs[g.id]) { g.V0 = NV; g.s0 = { x: _ptrs[g.id].x, y: _ptrs[g.id].y }; }
    else if (g && g.mode === "pinch") {
      var pa = _ptrs[g.ids[0]], pb = _ptrs[g.ids[1]];
      if (pa && pb) { g.V0 = NV; g.d0 = Math.max(1, Math.sqrt((pa.x - pb.x) * (pa.x - pb.x) + (pa.y - pb.y) * (pa.y - pb.y))); g.m0 = worldAt(NV, g.r0, (pa.x + pb.x) / 2, (pa.y + pb.y) / 2); }
    }
    liveRefresh();
  }
  function setPanning(on) { var st = document.querySelector("#fv-win .fv-stage"); if (st) st.classList.toggle("fv-panning", !!on); }
  function bindStage(stageEl, S) {
    var placeable = !!(MOVABLE[S.key] || AIMED[S.key]);
    if (_gest && (_gest.mode === "pan" || _gest.mode === "pinch")) stageEl.classList.add("fv-panning");
    stageEl.addEventListener("wheel", function (ev) {
      var dy = ev.deltaMode === 1 ? ev.deltaY * 16 : ev.deltaMode === 2 ? ev.deltaY * 400 : ev.deltaY;
      if (!dy) return;                           // a sideways wheel or swipe is not a zoom: leave the view (and FIT) alone
      ev.preventDefault();
      zoomAt(ev.clientX, ev.clientY, Math.exp(Math.max(-60, Math.min(60, dy)) * (ev.ctrlKey ? 0.012 : 0.0016)));
    }, { passive: false });
    // the middle button would start the browser's autoscroll, and a long press its context menu
    stageEl.addEventListener("mousedown", function (ev) { if (ev.button === 1) ev.preventDefault(); });
    stageEl.addEventListener("auxclick", function (ev) { if (ev.button === 1) ev.preventDefault(); });
    stageEl.addEventListener("contextmenu", function (ev) { if (_gest) ev.preventDefault(); });
    stageEl.addEventListener("pointerdown", function (ev) {
      var mid = ev.button === 1;
      if (!mid && ev.button != null && ev.button !== 0) return;
      var r = stageRect(), V = _lastView; if (!r || !V) return;
      _ptrs[ev.pointerId] = { x: ev.clientX, y: ev.clientY };
      var ids = Object.keys(_ptrs);
      if (ids.length >= 2 && !(_gest && _gest.mid)) {          // a second finger: pinch (a drag in progress stops where it is)
        if (_gest) clearTimeout(_gest.timer);
        var pa = _ptrs[ids[0]], pb = _ptrs[ids[1]];
        ev.preventDefault();
        _dragView = null;
        _gest = { mode: "pinch", ids: ids.slice(0, 2), d0: Math.max(1, Math.sqrt((pa.x - pb.x) * (pa.x - pb.x) + (pa.y - pb.y) * (pa.y - pb.y))),
                  m0: worldAt(V, r, (pa.x + pb.x) / 2, (pa.y + pb.y) / 2), V0: V, r0: r };
        setPanning(true);
        return;
      }
      if (_gest) return;
      var p = worldAt(V, r, ev.clientX, ev.clientY);
      // a short window letterboxes the map: a press in the blank band beside it places nothing (it still pans)
      var onBoard = Math.abs(p.x - V.cx) <= V.hw + 0.5 && Math.abs(p.y - V.cy) <= V.hh + 0.5;
      ev.preventDefault();
      if (mid) { _gest = { mode: "pan", mid: true, id: ev.pointerId, s0: { x: ev.clientX, y: ev.clientY }, V0: V, r0: r }; setPanning(true); return; }
      _gest = { mode: "pending", id: ev.pointerId, s0: { x: ev.clientX, y: ev.clientY }, V0: V, r0: r, placeable: placeable && onBoard };
      var g = _gest;
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
      var dd = Math.max(1, Math.sqrt((pa.x - pb.x) * (pa.x - pb.x) + (pa.y - pb.y) * (pa.y - pb.y)));
      var hw = clampHalf(g.V0.hw * g.d0 / dd), u = upp({ hw: hw, hh: hw * ASPECT }, g.r0);
      var mx = (pa.x + pb.x) / 2, my = (pa.y + pb.y) / 2;
      setView(g.m0.x - (mx - (g.r0.left + g.r0.width / 2)) * u, g.m0.y - (my - (g.r0.top + g.r0.height / 2)) * u, hw);
      liveRefresh(); return;
    }
    if (ev.pointerId !== g.id) return;
    var dx = ev.clientX - g.s0.x, dy = ev.clientY - g.s0.y;
    if (g.mode === "pending" && Math.sqrt(dx * dx + dy * dy) > SLOP) {
      clearTimeout(g.timer);
      if (g.placeable) { g.mode = "place"; _dragView = g.V0; } else { g.mode = "pan"; setPanning(true); }
    }
    if (g.mode === "place") { placeFrom(ev); return; }
    if (g.mode === "pan") { var u0 = upp(g.V0, g.r0); setView(g.V0.cx - dx * u0, g.V0.cy - dy * u0, g.V0.hw); liveRefresh(); }
  }
  function gestEnd(ev) {
    delete _ptrs[ev.pointerId];
    var g = _gest; if (!g) return;
    if (g.mode === "pinch") {
      if (g.ids.indexOf(String(ev.pointerId)) === -1) return;
      _gest = null; _ptrs = {}; setPanning(false); if (_last) refresh(_last); return;
    }
    if (ev.pointerId !== g.id) return;
    clearTimeout(g.timer); _gest = null;
    if (g.mode === "pending" && g.placeable && ev.type === "pointerup") { _dragView = g.V0; placeFrom(ev); }   // a tap places
    _dragView = null; setPanning(false);
    if (_last) refresh(_last);
  }
  document.addEventListener("pointermove", gestMove);
  document.addEventListener("pointerup", gestEnd);
  document.addEventListener("pointercancel", gestEnd);

  /* ---- the window --------------------------------------------------------------------------- */
  function isOpen() { return _open; }
  function stageSummary(form, inv, d, S) {
    var lines = [];
    lines.push(S.text + (S.where ? " · " + S.where : ""));
    if (S.unplaced > 0) lines.push(S.unplaced + " more than there are spaces " + (S.key === "remote" ? "within " + RANGE + " of you" : "beside you") + " (not drawn)");
    if (S.shape && S.caught != null) lines.push(S.caught + " space" + (S.caught === 1 ? "" : "s") + " caught" + (S.allies.length ? ", " + S.allies.length + " spared by Precision Shaping" : ""));
    if (inv && inv.layer) lines.push("Layered: " + (inv.resonance ? inv.resonance.name : "") + " + " + inv.layer.resonance.name + ", one Complex Action");
    if (form.duration === "sustain") lines.push("Sustained: holds 1 minute (10 rounds), +1 FP each extra minute");
    return lines;
  }
  function zoomBy(dir) {
    var cur = _zoom != null ? _zoom : _lastFit;
    _zoom = dir === "in" ? Math.max(ZOOM_IN_MIN, cur / ZOOM_STEP) : Math.min(MAX_HALF, cur * ZOOM_STEP);
    if (_last) refresh(_last);
  }
  function zoomFit() { _zoom = null; _viewC = null; if (_last) refresh(_last); }
  function atMin() { return _lastHalf <= ZOOM_IN_MIN + 1e-6; }
  function atMax() { return _lastHalf >= MAX_HALF - 1e-6; }
  function build(ctx) {
    var form = ctx.form, inv = ctx.inv, d = ctx.d;
    var S = scene(form, inv, d);
    var svg = draw(form, inv, d, S);
    _lastScene = S;
    var resKey = form.resonance, col = resColor(resKey), col2 = inv && inv.layer ? resColor(form.layer && form.layer.resonance) : col;
    var cost = inv ? inv.fp : 0;
    var stage = ctx.fx != null ? ctx.fx : (d.flow && d.flow.strainStage) || 0;

    var stage_ = el("div.fv-stage");
    stage_.innerHTML = svg;
    bindStage(stage_, S);
    // the key names only what is on the board, on a backing of its own so the grid does not run through it
    var keys = [el("span.fv-lg.fv-lg-you", { text: "YOU" })];
    if (S.drawn.foe) keys.push(el("span.fv-lg.fv-lg-foe", { text: S.key === "touch" || S.key === "remote" ? "TARGET" : "FOE" }));
    if (S.drawn.obj) keys.push(el("span.fv-lg.fv-lg-obj", { text: "OBJECT" }));
    if (S.drawn.ally) keys.push(el("span.fv-lg.fv-lg-ally", { text: "SPARED" }));
    if (S.drawn.zone) keys.push(el("span.fv-lg.fv-lg-zone", { text: "ZONE" }));
    if (S.range) keys.push(el("span.fv-lg.fv-lg-range", { text: "REACH " + S.range + (S.reachInView ? "" : " (past the view)") }));
    // aim: move a placed point (or a Sigil's mark) a space at a time, or turn it round you; turn an aimed shape
    function aimBtn(label, title, act, data) {
      return el("button.btn.sm", { type: "button", dataset: { fvAim: data }, title: title, "aria-label": title,
        onclick: function () { if (act() && _last) refresh(_last); } }, label);
    }
    var key0 = S.key, aimRow = null;
    if (MOVABLE[key0] || AIMED[key0]) {
      var what = AIMED[key0] ? "the " + key0 : key0 === "sigil" ? "the mark" : key0 === "remote" ? "the target" : "the point";
      var kids = [el("span.fv-aim-lab", { text: AIMED[key0] ? "AIM " + S.heading : "MOVE" })];
      if (MOVABLE[key0]) {
        kids.push(aimBtn("\u2190", "Move " + what + " one space left", function () { return nudge(key0, "left"); }, "left"));
        kids.push(aimBtn("\u2191", "Move " + what + " one space up", function () { return nudge(key0, "up"); }, "up"));
        kids.push(aimBtn("\u2193", "Move " + what + " one space down", function () { return nudge(key0, "down"); }, "down"));
        kids.push(aimBtn("\u2192", "Move " + what + " one space right", function () { return nudge(key0, "right"); }, "right"));
      }
      kids.push(aimBtn("\u27f2", (AIMED[key0] ? "Turn " + what : "Turn " + what + " round you") + " " + stepDeg() + " degrees anticlockwise", function () { return turnBy(key0, -1); }, "ccw"));
      kids.push(aimBtn("\u27f3", (AIMED[key0] ? "Turn " + what : "Turn " + what + " round you") + " " + stepDeg() + " degrees clockwise", function () { return turnBy(key0, 1); }, "cw"));
      kids.push(aimBtn("RESET", "Put " + what + " back where it starts", function () { resetAim(key0); return true; }, "reset"));
      kids.push(el("span.fv-aim-hint", { text: AIMED[key0] ? "or tap the map the way it faces" : "or tap or drag on the map" }));
      aimRow = el("div.fv-aimrow", { dataset: { fvAimRow: key0 } }, kids);
    }
    var bar = el("div.fv-bar", null, [
      el("div.fv-legend", { dataset: { fvKey: "1" } }, keys),
      el("div.fv-zoom", null, [
        el("button.btn.sm", { type: "button", dataset: { fvZoom: "out" }, disabled: atMax(), title: "Zoom out", "aria-label": "Zoom out", onclick: function () { zoomBy("out"); } }, "−"),
        el("button.btn.sm" + (_zoom == null ? ".primary" : ""), { type: "button", dataset: { fvZoom: "fit" }, title: "Fit the view to the Invocation", onclick: zoomFit }, "FIT"),
        el("button.btn.sm", { type: "button", dataset: { fvZoom: "in" }, disabled: atMin(), title: "Zoom in", "aria-label": "Zoom in", onclick: function () { zoomBy("in"); } }, "+")
      ]),
      aimRow,
      el("div.fv-nav-hint", { text: "Wheel or pinch to zoom · hold, then drag (or the middle button) to pan · FIT to come back" })
    ]);

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
    var pan = EN.ui.panel("Visualize", "SCALE AND DELIVERY", [stage_, bar, read, el("div.fv-ctl", null, [ctx.controls || null])], { corners: true, headerRight: head });
    var win = el("div#fv-win.fv-win" + (_imm ? ".fv-immersive" : "") + (aimRow ? ".fv-aiming" : ""), { dataset: { fx: String(Math.max(0, Math.min(5, stage))), grid: _grid, res: resKey || "" }, role: "dialog", "aria-label": "Visualize the Invocation" }, [pan]);
    win.style.setProperty("--fv-res", col); win.style.setProperty("--fv-res2", col2);
    win.style.setProperty("--fv-pulse", String(1 + Math.max(0, stage) * 0.35));
    /* the window is rebuilt on every change; a negative delay from one clock keeps every looping animation
       (the deck's sweep and breathing, the blinking diamonds) in step instead of restarting each time */
    win.style.setProperty("--fv-t", "-" + (Date.now() % 600000) + "ms");
    // Immersive: the Flow tab's two pin-light tracers, round the window and round its deck (theme.css)
    // (the deck node is reused when the window redraws on its own, from a zoom or an aim: clear its old pair first)
    [].slice.call(pan.querySelectorAll(".beam")).forEach(function (b) { b.parentNode.removeChild(b); });
    // the violet light is a Gremlin with its own place and pace on each (--go, --gs); the gold one is a Nixie
    if (_imm) [pan, pan.querySelector(".fv-deck")].forEach(function (h, i) { if (h) h.insertAdjacentHTML("beforeend", '<i class="beam" style="--go:-' + (i * 5.3) + 's;--gs:' + (i ? 1.03 : 1) + '"></i><i class="beam b2"></i>'); });
    return win;
  }
  function droid() { try { return document.documentElement.classList.contains("skin-droid"); } catch (e) { return false; } }
  // keep the title bar (the drag handle and the X) on the screen: top at or below 0, 120px of it in from each side
  function clampPos(p, win) {
    var de = document.documentElement, vw = de.clientWidth || window.innerWidth || 1200, vh = de.clientHeight || window.innerHeight || 800, w = win.offsetWidth || 470, h = win.offsetHeight || 400;
    return { right: Math.max(120 - w, Math.min(vw - 120, p.right)), bottom: Math.max(0, Math.min(Math.max(0, vh - h), p.bottom)) };
  }
  function place(win) {
    var vw = window.innerWidth || 1200;
    /* a phone, or the #GRIDroid skin (whose device frame masks everything outside its column):
       a sheet along the bottom, inside the screen it is drawn on (theme.css places the droid one) */
    if (vw < 700 || droid()) {
      win.classList.add("fv-sheet"); if (droid()) win.classList.add("fv-droid");
      win.style.left = droid() ? "" : "0"; win.style.right = droid() ? "" : "0"; win.style.bottom = droid() ? "" : "0"; win.style.top = "auto";
      if (droid()) {
        // the dock (the app list) is fixed along the bottom of the screen: the sheet sits above it, never over it
        var dock = document.querySelector(".os-tabs"), dh = dock ? Math.round(dock.getBoundingClientRect().height) : 0;
        win.style.bottom = (dh + 8) + "px";
        win.style.setProperty("--fv-maxh", "calc(100vh - " + (dh + 60) + "px)");
      }
      return;
    }
    var p = _pos || { right: 18, bottom: 18 };
    win.style.right = p.right + "px"; win.style.bottom = p.bottom + "px"; win.style.left = "auto"; win.style.top = "auto";
    var c = clampPos(p, win);
    if (c.right !== p.right || c.bottom !== p.bottom) { _pos = c; win.style.right = c.right + "px"; win.style.bottom = c.bottom + "px"; }
  }
  function dragHandle(win) {
    var h = win.querySelector(".panel-h"); if (!h || win.classList.contains("fv-sheet")) return;
    h.style.cursor = "move";
    h.addEventListener("pointerdown", function (ev) {
      if (ev.target.closest && ev.target.closest("button")) return;
      var r = win.getBoundingClientRect(), sx = ev.clientX, sy = ev.clientY, de = document.documentElement, vw = de.clientWidth || window.innerWidth, vh = de.clientHeight || window.innerHeight;
      function mv(e) {
        // the window may have been redrawn mid-drag: always move the one on the page
        var cur = document.getElementById("fv-win") || win;
        var p = clampPos({ right: vw - (r.right + (e.clientX - sx)), bottom: vh - (r.bottom + (e.clientY - sy)) }, cur);
        _pos = p; cur.style.right = p.right + "px"; cur.style.bottom = p.bottom + "px";
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
    var body = _win && _win.querySelector(".panel-b"), keepScroll = body ? body.scrollTop : 0;
    // which control had focus, by a key that survives the redraw, so a keyboard user stays on it
    var fk = (_win && document.activeElement && _win.contains(document.activeElement)) ? focusKey(document.activeElement, _win) : null;
    var win = build(ctx);
    if (_win && _win.parentNode) _win.parentNode.replaceChild(win, _win); else document.body.appendChild(win);
    _win = win; win.style.display = ""; place(win); dragHandle(win);
    var sc = win.querySelector(".panel-b"); if (sc) sc.scrollTop = keepScroll;
    if (fk) restoreFocus(fk, win);
    watch();
  }
  /* A control's key: the zoom buttons by their job; a shaping button by its row (the row's label and
     place) and its own text, with its place in the row as the fallback; the title bar's by text. */
  function controls(root) { return Array.prototype.slice.call(root.querySelectorAll("button, input, select")); }
  function focusKey(node, root) {
    if (node.getAttribute && node.getAttribute("data-fv-zoom")) return { zoom: node.getAttribute("data-fv-zoom") };
    if (node.getAttribute && node.getAttribute("data-fv-aim")) return { aim: node.getAttribute("data-fv-aim") };
    var row = node.closest && node.closest(".fv-row");
    if (row) {
      var rows = Array.prototype.slice.call(root.querySelectorAll(".fv-row")), inRow = controls(row);
      return { row: rows.indexOf(row), text: node.textContent, at: inRow.indexOf(node) };
    }
    return { text: node.textContent, head: !!(node.closest && node.closest(".panel-h, .panel-hr, .win-tools")) };
  }
  function focusOn(t) { if (!t) return false; try { t.focus({ preventScroll: true }); } catch (e) { t.focus(); } return document.activeElement === t; }
  function restoreFocus(k, root) {
    if (k.aim) { var ab = root.querySelector('[data-fv-aim="' + k.aim + '"]'); if (ab && !ab.disabled) return focusOn(ab); }
    if (k.zoom) {
      var z = root.querySelector('[data-fv-zoom="' + k.zoom + '"]');
      if (z && !z.disabled) return focusOn(z);
      return focusOn(root.querySelector('[data-fv-zoom="fit"]'));   // + or - at its limit: FIT is beside it
    }
    if (k.row != null) {
      var row = root.querySelectorAll(".fv-row")[k.row]; if (!row) return false;
      var inRow = controls(row), same = inRow.filter(function (b) { return b.textContent === k.text && !b.disabled; })[0];
      if (same) return focusOn(same);
      var near = inRow.filter(function (b) { return !b.disabled; });   // a stepper at its limit: the nearest live control in that row
      near.sort(function (a, b) { return Math.abs(inRow.indexOf(a) - k.at) - Math.abs(inRow.indexOf(b) - k.at); });
      return focusOn(near[0]);
    }
    var hit = controls(root).filter(function (b) { return b.textContent === k.text && !b.disabled && (!k.head || (b.closest && b.closest(".panel-h, .panel-hr, .win-tools"))); })[0];
    return focusOn(hit);
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
    _open = false; _zoom = null; _viewC = null; _gest = null; _ptrs = {}; _dragView = null;   // the next opening fits the Invocation again
    if (_win && _win.parentNode) _win.parentNode.removeChild(_win);
    _win = null;
    try { EN.app.render(); } catch (e) {}   // the builder's VISUALIZE button reads its state back
  }
  function toggle() { if (_open) close(); else { _open = true; _zoom = null; _viewC = null; EN.app.render(); } }
  function setGrid(g) { var ng = g === "hex" ? "hex" : "square"; if (ng !== _grid) _aim = { point: null, mark: null, turn: 0, orbit: null }; _grid = ng; try { localStorage.setItem(GRID_KEY, _grid); } catch (e) {} if (_last) refresh(_last); }
  function setImm(on) { _imm = !!on; try { localStorage.setItem(IMM_KEY, _imm ? "1" : "0"); } catch (e) {} if (_last) refresh(_last); }

  return { isOpen: isOpen, open: open, close: close, toggle: toggle, refresh: refresh, scene: scene,
           grid: function () { return _grid; }, immersive: function () { return _imm; }, setGrid: setGrid, setImmersive: setImm,
           zoom: function () { return _zoom; }, zoomBy: zoomBy, zoomFit: zoomFit, dist: function (c) { return dist(c); }, resColor: resColor,
           aim: function () { return { point: _aim.point, mark: _aim.mark, turn: turnNow(), heading: dirs()[turnNow()] }; },
           aimAt: function (key, x, y) { var ch = aimAt(key, x, y); if (ch && _last) refresh(_last); return ch; },
           turnBy: function (key, k) { var ch = turnBy(key, k); if (ch && _last) refresh(_last); return ch; },
           resetAim: function () { _aim = { point: null, mark: null, turn: 0, orbit: null }; if (_last) refresh(_last); } };
})();
