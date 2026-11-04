/* ===========================================================================
   ELYSIUM NIGHTS · Flow tab · Visualize window
   A pop-open window that DRAWS the Invocation being free-shaped: you at the centre of a grid,
   the reach, and the Delivery's area at the size you have bought, in the Resonance's colour.
   Change anything in the builder (or in the window's own controls, which are the same controls)
   and the picture reshapes on the spot.

   What it draws is the book's, taken from the one place the app already settles it:
     EN.aoeGrid (js/aoegrid.js) owns the cell geometry (Sphere, Cube, Cone, Line, Aura on a
     square or hex grid, diagonals cost 1), so this window and the Codex's Area diagram can never
     disagree about what a Sphere or a Cone catches. A Cube anchors its near corner on its point,
     as the Codex diagram draws it.
     EN.flow.deliveryTable owns the reach and size of each Delivery (Handbook, The Flow >
     Invocations): Remote, Cube and Sphere reach 12 spaces; Touch is a target you touch; Sigil is
     a mark within your reach and fires "centered on the mark"; Aura, Cone and Line start on you.
     Each extra space bought (+1 FP) grows one dimension: a radius, a widest point, a length or an
     edge. Each extra target bought for a Directed Delivery is another target of the same kind:
     beside you for Touch and Imbue, within 12 spaces for Remote.
   Conventions this window CHOOSES (the book leaves them open, as aoegrid.js says of its own):
     a point-placed area sits 6 spaces out on your facing line; your reach is the spaces beside
     you (1), which is where Touch targets, Imbued objects and a Sigil's mark go; which spaces the
     sample foes and spared allies stand on.
   The view: you are always at its centre, and it zooms itself to fit everything the Invocation
   touches (the area, its targets, its point), never narrower than 9 spaces. The - FIT + buttons
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
  try { if (localStorage.getItem(GRID_KEY) === "hex") _grid = "hex"; } catch (e) {}
  try { _imm = localStorage.getItem(IMM_KEY) === "1"; } catch (e) {}

  /* SVG units: one space is C across. The view is centred on you (0,0); its height is ASPECT of its width. */
  var C = 20, RANGE = 12, ASPECT = 0.75;
  var MIN_HALF = 4.5, MAX_HALF = 30, ZOOM_IN_MIN = 2.5, ZOOM_STEP = 1.35;
  var SQ3 = Math.sqrt(3), HEXR = C / SQ3;

  /* one colour per Resonance (a hex, because an SVG fill in a style string needs a literal) */
  var RES = { kinetic: "#ffb347", thermal: "#ff5a3c", electromagnetic: "#4cc9ff", visceral: "#6ee07a",
              spatial: "#b98bff", cognitive: "#ff7ad9", synthetica: "#3fe0c5", temporal: "#e9d6a8" };
  function resColor(key) { return RES[key] || "#b98bff"; }

  /* ---- grid geometry ------------------------------------------------------------------------ */
  function G() { return EN.aoeGrid || null; }
  function dist(a) { return _grid === "hex" ? G().hexDist(a.q, a.r) : G().sqDist(a.x, a.y); }
  function cell(a, b) { return _grid === "hex" ? { q: a, r: b } : { x: a, y: b }; }
  function add(c, a, b) { return _grid === "hex" ? { q: c.q + a, r: c.r + b } : { x: c.x + a, y: c.y + b }; }
  function ck(c) { return _grid === "hex" ? c.q + ":" + c.r : c.x + ":" + c.y; }
  function isOrigin(c) { return _grid === "hex" ? (c.q === 0 && c.r === 0) : (c.x === 0 && c.y === 0); }
  // a space's centre, in SVG units, with you at 0,0 (pointy-top hexes, axial q,r)
  function pt(c) {
    if (_grid === "hex") return { x: C * (c.q + c.r / 2), y: C * (SQ3 / 2) * c.r };
    return { x: c.x * C, y: c.y * C };
  }
  // the spaces beside you, nearest your facing (east) first: your reach
  function beside() {
    return _grid === "hex"
      ? [[1, 0], [1, -1], [0, 1], [0, -1], [-1, 1], [-1, 0]].map(function (p) { return cell(p[0], p[1]); })
      : [[1, 0], [1, -1], [1, 1], [0, -1], [0, 1], [-1, -1], [-1, 1], [-1, 0]].map(function (p) { return cell(p[0], p[1]); });
  }
  function shapeCells(shape, n) { return _grid === "hex" ? G().hexCells(shape, n) : G().sqCells(shape, n); }
  // move a shape so the space nearest its middle sits on the mark (the Sigil fires "centered on the mark")
  function centredOn(cells, mark) {
    var mx = 0, my = 0;
    cells.forEach(function (c) { var p = pt(c); mx += p.x; my += p.y; });
    mx /= cells.length; my /= cells.length;
    var best = cells[0], bd = Infinity;
    cells.forEach(function (c) { var p = pt(c), dd = (p.x - mx) * (p.x - mx) + (p.y - my) * (p.y - my); if (dd < bd - 1e-6) { bd = dd; best = c; } });
    var sa = _grid === "hex" ? mark.q - best.q : mark.x - best.x, sb = _grid === "hex" ? mark.r - best.r : mark.y - best.y;
    return cells.map(function (c) { return add(c, sa, sb); });
  }

  /* Delivery option label ("Cube (2 spaces)") -> its key and the size the book gives it; extra spaces
     bought grow it one for one */
  var BASE_SIZE = { cube: 2, sigil: 2, aura: 2, cone: 3, sphere: 3, line: 6 };
  var SHAPE_OF = { cube: "cube", sigil: "cube", aura: "aura", cone: "cone", sphere: "sphere", line: "line" };
  function optKey(opt) { return String(opt || "").replace(/ \([^)]*\)$/, "").toLowerCase(); }
  /* where a Remote Invocation's targets stand: the first 6 spaces out, then every other space within 12
     of you (never on you), nearest the first one first, so they cluster round it and only a reach
     that is genuinely full leaves any unplaced */
  function remoteSpots() {
    var first = cell(6, 0), fp = pt(first), out = [], a, b;
    for (a = -RANGE; a <= RANGE; a++) for (b = -RANGE; b <= RANGE; b++) {
      var c = cell(a, b), dd = dist(c);
      if (dd < 1 || dd > RANGE || ck(c) === ck(first)) continue;
      var p = pt(c); out.push({ c: c, k: (p.x - fp.x) * (p.x - fp.x) + (p.y - fp.y) * (p.y - fp.y), ay: Math.abs(p.y), x: -p.x });
    }
    out.sort(function (u, v) { return (u.k - v.k) || (u.ay - v.ay) || (u.x - v.x); });
    return [first].concat(out.map(function (o) { return o.c; }));
  }

  /* Build the whole scene: the cells caught, the targets, the reach, the fit and the words */
  function scene(form, inv, d) {
    var key = optKey(form.deliveryOption), band = form.deliveryBand;
    var fMod = (d && d.flow && d.flow.attribute && d.attributes[d.flow.attribute]) ? d.attributes[d.flow.attribute].mod : 0;
    var S = { key: key, band: band, area: [], foes: [], allies: [], objects: [], spared: {}, range: 0, anchor: null, size: 0, shape: null, text: "", where: "", unplaced: 0 };
    var ex = Math.max(0, form.extraSpaces | 0), et = Math.max(0, form.extraTargets | 0);
    if (band === "directed") {
      var want = 1 + et, spots;
      if (key === "touch") { S.range = 1; spots = beside(); S.where = "a target you touch, beside you"; }
      else if (key === "imbue") { S.range = 1; spots = beside(); S.where = "an object or weapon within your reach; waits up to 1 minute"; }
      else {
        S.range = RANGE; S.where = "a target you can clearly see within " + RANGE + " spaces";
        spots = remoteSpots();
      }
      var placed = spots.slice(0, want);
      S.unplaced = want - placed.length;
      if (key === "imbue") S.objects = placed; else S.foes = placed;
      S.text = (key === "touch" ? "Touch" : key === "imbue" ? "Imbue" : "Remote") + ": " + (key === "imbue" ? "one object" : "one target") + (et ? " and " + et + " more" : "");
      fit(S); return S;
    }
    var n = (BASE_SIZE[key] || 2) + ex, shape = SHAPE_OF[key] || "sphere";
    S.size = n; S.shape = shape;
    var base = shapeCells(shape, n);
    if (key === "sphere") { S.anchor = cell(6, 0); S.area = base.map(function (c) { return add(c, 6, 0); }); S.range = RANGE; S.where = "centred on a point you can see within " + RANGE + " spaces, 6 spaces out"; }
    else if (key === "cube") { S.anchor = cell(6, 0); S.area = base.map(function (c) { return add(c, 6, 0); }); S.range = RANGE; S.where = "on a point you can see within " + RANGE + " spaces, near corner 6 spaces out"; }
    else if (key === "sigil") { S.anchor = cell(1, 0); S.area = centredOn(base, S.anchor); S.range = 1; S.where = "centred on a mark within your reach; waits up to 1 minute"; }
    else {
      S.area = base;
      S.where = key === "aura" ? "on you; it moves with you" : key === "cone" ? "from you, widest point " + n + " spaces across" : "from you, " + n + " spaces long, 1 wide";
    }
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
  /* The fit: the smallest view, centred on you, that holds everything the Invocation touches with half
     a space to spare, at least 9 spaces across, ASPECT high */
  function fit(S) {
    var mx = 0, my = 0;
    S.area.concat(S.foes, S.allies, S.objects, S.anchor ? [S.anchor] : []).forEach(function (c) {
      var p = pt(c); mx = Math.max(mx, Math.abs(p.x) / C); my = Math.max(my, Math.abs(p.y) / C);
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
  // every space in view, in paint order
  function boardCells(V) {
    var out = [], a, b, A = Math.ceil(V.hw) + 1, B;
    // a space is in view when any of it shows (half a space across; a hex is taller, its circumradius)
    var ry = _grid === "hex" ? 1 / SQ3 : 0.5;
    function inView(c) { var p = pt(c); return Math.abs(p.x) < (V.hw + 0.5) * C - 0.01 && Math.abs(p.y) < (V.hh + ry) * C - 0.01; }
    if (_grid === "hex") {
      B = Math.ceil(V.hh / (SQ3 / 2)) + 1;
      for (b = -B; b <= B; b++) { var sh = Math.ceil(Math.abs(b) / 2) + 1; for (a = -A - sh; a <= A + sh; a++) { var h = { q: a, r: b }; if (inView(h)) out.push(h); } }
    } else {
      B = Math.ceil(V.hh) + 1;
      for (a = -A; a <= A; a++) for (b = -B; b <= B; b++) { var s = { x: a, y: b }; if (inView(s)) out.push(s); }
    }
    out.inView = inView;
    // a token is drawn when any of its circle shows
    out.tokenInView = function (c) { var p = pt(c), r = 0.36; return Math.abs(p.x) < (V.hw + r) * C && Math.abs(p.y) < (V.hh + r) * C; };
    return out;
  }
  function draw(form, inv, d, S) {
    var forKey = (form.deliveryBand || "") + "|" + S.key;
    if (_zoom != null && _zoomFor !== forKey) _zoom = null;   // a new Delivery fits itself
    _zoomFor = forKey;
    var hw = _zoom != null ? _zoom : S.fitHalf, V = { hw: hw, hh: hw * ASPECT };
    _lastFit = S.fitHalf; _lastHalf = hw;
    S.drawn = { foe: 0, ally: 0, obj: 0, zone: 0 };
    var board = boardCells(V), inView = board.inView, tokIn = board.tokenInView, hit = {}, svg = [];
    S.area.forEach(function (c) { hit[ck(c)] = 1; });
    function inRange(c) { return S.range > 0 && dist(c) <= S.range && dist(c) > 0; }
    var lay = inv && inv.layer;
    svg.push('<defs><pattern id="fv-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="none"/><line x1="0" y1="0" x2="0" y2="6" stroke="currentColor" stroke-width="2"/></pattern></defs>');
    var field = "", ranged = "", over = "";
    board.forEach(function (c) {
      if (hit[ck(c)]) return;
      if (inRange(c)) ranged += cellShape(c, "fv-cell fv-range"); else field += cellShape(c, "fv-cell");
    });
    svg.push(field, ranged);
    // the area, over the field; each space carries its distance from you so the Immersive ripple can run outward
    var zone = inv && ((inv.empoweredEffect && inv.empoweredEffect.zone) || (inv.layer && inv.layer.empoweredEffect && inv.layer.empoweredEffect.zone));
    var sustain = form.duration === "sustain" && inv && inv.sustainable !== false;
    var spaces = 0;
    S.area.forEach(function (c, i) {
      if (!S.spared[ck(c)]) spaces++;
      if (!inView(c)) return;
      var cls = "fv-cell fv-hit" + (S.spared[ck(c)] ? " fv-spared" : "") + (lay && (i % 2 === 0) ? " fv-braid" : "");
      over += cellShape(c, cls, ' style="--d:' + Math.round(dist(c)) + '"');
      if (zone && !S.spared[ck(c)]) { over += cellShape(c, "fv-zone"); S.drawn.zone++; }
    });
    S.caught = spaces; S.zone = !!zone;
    svg.push('<g class="fv-area' + (sustain ? " fv-sustain" : "") + '">' + over + '</g>');
    // the reach, outlined at its far edge (named in the key instead when it runs past the view)
    var ring = "";
    if (S.range > 0) board.forEach(function (c) { if (Math.round(dist(c)) === S.range) ring += cellShape(c, "fv-ring"); });
    S.reachInView = !!ring;
    if (ring) svg.push('<g class="fv-rangering">' + ring + "</g>");
    // the line from you to where it lands
    var tgt = S.anchor || S.objects[0] || (S.band === "directed" ? S.foes[0] : null);
    if (tgt) {
      var b0 = pt(tgt);
      svg.push('<line class="fv-beam" x1="0" y1="0" x2="' + b0.x + '" y2="' + b0.y + '"/>');
    }
    if (S.anchor) { var ap = pt(S.anchor); svg.push('<g class="fv-anchor" transform="translate(' + ap.x + " " + ap.y + ')"><circle r="3.2"/><circle class="fv-anchor-ring" r="7"/></g>'); }
    S.objects.forEach(function (c) { if (tokIn(c)) { S.drawn.obj++; var op = pt(c); svg.push('<g class="fv-obj" transform="translate(' + op.x + " " + op.y + ')"><path d="M0,-7 L7,0 L0,7 L-7,0 Z"/></g>'); } });
    S.foes.forEach(function (c) { if (tokIn(c)) { S.drawn.foe++; svg.push(token(c, "fv-foe", '<path d="M-3.4,-3.4 L3.4,3.4 M3.4,-3.4 L-3.4,3.4"/>')); } });
    S.allies.forEach(function (c) { if (tokIn(c)) { S.drawn.ally++; svg.push(token(c, "fv-ally", '<path d="M-3.6,0.4 L-1,3 L3.8,-3"/>')); } });
    svg.push(token(cell(0, 0), "fv-you", '<circle class="fv-you-dot" r="3"/>'));
    // a wide view packs the spaces tight: its grid lines go fainter so the area still reads
    var dense = hw > 14 ? " fv-dense" : "";
    return '<svg class="fv-svg' + dense + '" viewBox="' + (-hw * C).toFixed(1) + " " + (-V.hh * C).toFixed(1) + " " + (2 * hw * C).toFixed(1) + " " + (2 * V.hh * C).toFixed(1) + '" data-half="' + hw.toFixed(2) + '" role="img" aria-label="' + S.text.replace(/"/g, "") + '">' + svg.join("") + "</svg>";
  }

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
  function zoomFit() { _zoom = null; if (_last) refresh(_last); }
  function atMin() { return _lastHalf <= ZOOM_IN_MIN + 1e-6; }
  function atMax() { return _lastHalf >= MAX_HALF - 1e-6; }
  function build(ctx) {
    var form = ctx.form, inv = ctx.inv, d = ctx.d;
    var S = scene(form, inv, d);
    var svg = draw(form, inv, d, S);
    var resKey = form.resonance, col = resColor(resKey), col2 = inv && inv.layer ? resColor(form.layer && form.layer.resonance) : col;
    var cost = inv ? inv.fp : 0;
    var stage = ctx.fx != null ? ctx.fx : (d.flow && d.flow.strainStage) || 0;

    var stage_ = el("div.fv-stage");
    stage_.innerHTML = svg;
    // the key names only what is on the board, on a backing of its own so the grid does not run through it
    var keys = [el("span.fv-lg.fv-lg-you", { text: "YOU" })];
    if (S.drawn.foe) keys.push(el("span.fv-lg.fv-lg-foe", { text: S.key === "touch" || S.key === "remote" ? "TARGET" : "FOE" }));
    if (S.drawn.obj) keys.push(el("span.fv-lg.fv-lg-obj", { text: "OBJECT" }));
    if (S.drawn.ally) keys.push(el("span.fv-lg.fv-lg-ally", { text: "SPARED" }));
    if (S.drawn.zone) keys.push(el("span.fv-lg.fv-lg-zone", { text: "ZONE" }));
    if (S.range) keys.push(el("span.fv-lg.fv-lg-range", { text: "REACH " + S.range + (S.reachInView ? "" : " (past the view)") }));
    var bar = el("div.fv-bar", null, [
      el("div.fv-legend", { dataset: { fvKey: "1" } }, keys),
      el("div.fv-zoom", null, [
        el("button.btn.sm", { type: "button", dataset: { fvZoom: "out" }, disabled: atMax(), title: "Zoom out", "aria-label": "Zoom out", onclick: function () { zoomBy("out"); } }, "−"),
        el("button.btn.sm" + (_zoom == null ? ".primary" : ""), { type: "button", dataset: { fvZoom: "fit" }, title: "Fit the view to the Invocation", onclick: zoomFit }, "FIT"),
        el("button.btn.sm", { type: "button", dataset: { fvZoom: "in" }, disabled: atMin(), title: "Zoom in", "aria-label": "Zoom in", onclick: function () { zoomBy("in"); } }, "+")
      ])
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
    var win = el("div#fv-win.fv-win" + (_imm ? ".fv-immersive" : ""), { dataset: { fx: String(Math.max(0, Math.min(5, stage))), grid: _grid, res: resKey || "" }, role: "dialog", "aria-label": "Visualize the Invocation" }, [pan]);
    win.style.setProperty("--fv-res", col); win.style.setProperty("--fv-res2", col2);
    win.style.setProperty("--fv-pulse", String(1 + Math.max(0, stage) * 0.35));
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
    var row = node.closest && node.closest(".fv-row");
    if (row) {
      var rows = Array.prototype.slice.call(root.querySelectorAll(".fv-row")), inRow = controls(row);
      return { row: rows.indexOf(row), text: node.textContent, at: inRow.indexOf(node) };
    }
    return { text: node.textContent, head: !!(node.closest && node.closest(".panel-h, .panel-hr, .win-tools")) };
  }
  function focusOn(t) { if (!t) return false; try { t.focus({ preventScroll: true }); } catch (e) { t.focus(); } return document.activeElement === t; }
  function restoreFocus(k, root) {
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
    _open = false; _zoom = null;   // the next opening fits the Invocation again
    if (_win && _win.parentNode) _win.parentNode.removeChild(_win);
    _win = null;
    try { EN.app.render(); } catch (e) {}   // the builder's VISUALIZE button reads its state back
  }
  function toggle() { if (_open) close(); else { _open = true; _zoom = null; EN.app.render(); } }
  function setGrid(g) { _grid = g === "hex" ? "hex" : "square"; try { localStorage.setItem(GRID_KEY, _grid); } catch (e) {} if (_last) refresh(_last); }
  function setImm(on) { _imm = !!on; try { localStorage.setItem(IMM_KEY, _imm ? "1" : "0"); } catch (e) {} if (_last) refresh(_last); }

  return { isOpen: isOpen, open: open, close: close, toggle: toggle, refresh: refresh, scene: scene,
           grid: function () { return _grid; }, immersive: function () { return _imm; }, setGrid: setGrid, setImmersive: setImm,
           zoom: function () { return _zoom; }, zoomBy: zoomBy, zoomFit: zoomFit, dist: function (c) { return dist(c); }, resColor: resColor };
})();
