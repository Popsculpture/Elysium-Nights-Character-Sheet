/* ===========================================================================
   ELYSIUM NIGHTS · Wall-to-Wall room diagram
   The Codex's Wall-to-Wall panel (mv-wall, js/codex_movement.js) carries this:
   build a room, set the blast, put down cover, allies and foes, and see what the
   walls do. The 4 Nov 2026 request (the author): "set the room size and shape,
   place down cover, allies and combatants, place the explosive and radius and
   have it show rebound and pressure, along with text call outs that hover over
   the impacted beings in the affected area".

   WHAT THE BOOK SETTLES, and this computes literally (EN.movement.wallToWall,
   EN.combat.cover and coverAndDefense):
     Trigger   a damaging Area, Sphere or Cube, in an enclosed space. Vented (a
               blown-out wall, an open roof, a wide doorway): none of it applies.
               A lingering cloud doesn't rebound; it simply fills the space.
     Rebound   the Area's width against the room's tightest open dimension: one
               extra die of its own damage per space it is wider, up to its
               normal dice. A Sphere of X is 2X + 1 across, a Cube of X is X.
     Sealed    each target in the Area saves with Snag, and Half and
               Three-Quarter Cover grant no bonus.
     Pressure  the room counts one space narrower for Rebound.
     Cover     vented, Half Cover gives +2 and Three-Quarter +5 to the Agility
               save, when it stands between the target and where the blast goes off.

   WHERE THE TURNED-BACK BLAST GOES (the author, 4 Nov 2026, with a drawing): the
   spaces of the Area that land in a wall the blast can't break aren't lost; they are
   pushed back into the room and fill the open space there. Dictated, 4 Nov 2026: the
   blast runs straight out until it hits a wall, then splashes left and right along it,
   and runs on until the next wall. Cover splits it, and shelters the spaces behind it:
   "it's meant to protect people who take cover". Only when every other open space is
   full and there is still spillover does it backfill the spaces behind cover. What finds
   no space at all folds back into the blast (4 Nov 2026, with a drawing): each such space
   bounces off the wall it hit, its mirror across that wall, back onto the spaces already
   caught, so a space by one wall is hit again once and a corner twice. Each time is a
   BOUNCE (the author's rulings, 4 Nov 2026: "Rebound" in the Handbook is only the extra
   dice from an oversized Area). A space the overflow merely flows into has no Bounce.
   The marks: one red hash per Bounce, an X for two, an X with a line through it for
   three, solid red for four or more; the overflow spaces keep their own hatch, in the
   template's colour and at the other angle, so red always means a Bounce.
   A target adds one die of the blast's own damage per Bounce on its space, up to its
   normal number of dice (a cap of their own, apart from Rebound's), part of the same
   attack. The Bounce dice are rolled once, in a line: Bounce 2 adds the first two. A
   body standing in any of those spaces is caught like any other. Vented, the blast escapes instead; a
   lingering cloud fills the space the same way, with no extra dice.

   WHAT THE BOOK DOES NOT SETTLE, and this diagram therefore CHOOSES (and says so
   on its face): the Area is the Codex template's (membership by centre, js/aoegrid.js)
   placed on the blast's space; sealed, it reaches every space of the Area in the room,
   round an L's corner too ("the pressure fills every corner"); vented, a space with a
   wall between it and the blast isn't caught; an L-shaped room's tightest open
   dimension is its arm; a cover piece counts when its space lies on the straight line
   from the blast to the target, and only for an Agility save (the cover rule's own
   words). The save and what a save does (half, or none) are the reader's to set,
   since a weapon's entry names them. Borderline calls are the GM's, as the book says.

   Its state lives in module scope, so it outlives an EN.app.render() teardown, and the
   widget redraws only its own parts. No em or en dashes anywhere in this file (house style).
   =========================================================================== */
window.EN = window.EN || {};

EN.wallGrid = (function () {
  var el = EN.ui.el, clear = EN.ui.clear;
  var U = 24, MAXR = 20, MAXA = 10, SLOP = 6;

  var S = {
    shape: "rect", w: 12, h: 3, arm: 3,   // the book's own example: a corridor 3 spaces wide
    vent: false, cloud: false, pressure: false,
    area: "sphere", size: 2, dice: 2, die: 6, save: "Agility", onSave: "half",
    blast: { x: 5, y: 1 }, cur: { x: 5, y: 1 },   // cur: the keyboard's cursor in the room
    items: {}, next: { ally: 1, foe: 1 },
    tool: "blast"
  };
  function k(x, y) { return x + ":" + y; }
  function put(x, y, kind) { var it = { kind: kind }; if (kind === "ally" || kind === "foe") it.n = S.next[kind]++; S.items[k(x, y)] = it; }
  put(3, 0, "foe"); put(10, 2, "foe"); put(7, 1, "ally"); put(6, 1, "three");

  var PRESETS = [
    { key: "room", label: "ROOM", shape: "rect", w: 8, h: 6 },
    { key: "corridor", label: "CORRIDOR", shape: "rect", w: 12, h: 3 },
    { key: "stairwell", label: "STAIRWELL", shape: "rect", w: 4, h: 4 },
    { key: "car", label: "PARKED CAR", shape: "rect", w: 4, h: 2 },
    { key: "container", label: "CONTAINER", shape: "rect", w: 8, h: 3 },
    { key: "lhall", label: "L-HALL", shape: "l", w: 10, h: 8, arm: 3 }
  ];

  /* ---- the room ------------------------------------------------------------------------- */
  function armNow() { return Math.max(1, Math.min(S.arm, S.w, S.h)); }
  // an L: the full-height arm down the left, the full-width arm along the bottom
  function isFloor(x, y) {
    if (x < 0 || y < 0 || x >= S.w || y >= S.h) return false;
    if (S.shape !== "l") return true;
    var a = armNow();
    return x < a || y >= S.h - a;
  }
  function tightest() { return S.shape === "l" ? Math.min(armNow(), S.w, S.h) : Math.min(S.w, S.h); }
  function floorCells() { var out = []; for (var y = 0; y < S.h; y++) for (var x = 0; x < S.w; x++) if (isFloor(x, y)) out.push({ x: x, y: y }); return out; }
  // after the room changes: anything off the floor goes, and the blast moves to the nearest floor
  function settle() {
    Object.keys(S.items).forEach(function (key) { var p = key.split(":"); if (!isFloor(+p[0], +p[1])) delete S.items[key]; });
    if (!isFloor(S.blast.x, S.blast.y)) {
      var best = null, bd = Infinity;
      floorCells().forEach(function (c) { var d = (c.x - S.blast.x) * (c.x - S.blast.x) + (c.y - S.blast.y) * (c.y - S.blast.y); if (d < bd) { bd = d; best = c; } });
      if (best) S.blast = { x: best.x, y: best.y };
    }
    if (!isFloor(S.cur.x, S.cur.y)) S.cur = { x: S.blast.x, y: S.blast.y };
  }

  /* ---- the blast ------------------------------------------------------------------------ */
  // the spaces between two centres, along the straight line (both ends left out)
  function between(a, b) {
    var dx = b.x - a.x, dy = b.y - a.y, n = Math.ceil(Math.sqrt(dx * dx + dy * dy) * 6), seen = {}, out = [];
    for (var i = 1; i < n; i++) {
      var t = i / n, x = Math.round(a.x + dx * t), y = Math.round(a.y + dy * t), key = k(x, y);
      if (seen[key] || (x === a.x && y === a.y) || (x === b.x && y === b.y)) continue;
      seen[key] = 1; out.push({ x: x, y: y });
    }
    return out;
  }
  function clearPath(a, b) { return between(a, b).every(function (c) { return isFloor(c.x, c.y); }); }
  function areaWidth() { return S.area === "cube" ? S.size : 2 * S.size + 1; }
  function scene() {
    var G = EN.aoeGrid, B = S.blast;
    var raw = G ? G.cellsAt("square", S.area, S.size, 0).map(function (c) { return { x: c.x + B.x, y: c.y + B.y }; }) : [];
    var hit = {}, behind = {}, spill = {};
    raw.forEach(function (c) {
      var key = k(c.x, c.y);
      if (!isFloor(c.x, c.y)) spill[key] = c;
      else if (!S.vent || clearPath(B, c)) hit[key] = c;   // sealed: the pressure fills every corner
      else behind[key] = c;
    });
    var blastFx = !S.cloud, sealed = !S.vent && blastFx;
    // the spaces the walls turn back fill the open room (not when it vents)
    var spillN = Object.keys(spill).length, pushed = S.vent ? {} : push(hit, spillN, B);
    Object.keys(pushed).forEach(function (key) { hit[key] = pushed[key]; });
    /* what finds no open space folds back into the blast: the outermost spaces of the overflow first, each
       mirrored across the wall it hit (again, if the mirror is in a wall too) onto a space already caught */
    var folds = {}, folded = 0;
    if (!S.vent && blastFx) {
      var left = spillN - Object.keys(pushed).length;
      var order = Object.keys(spill).map(function (key) { return spill[key]; })
        .sort(function (a, b) { return ((b.x - B.x) * (b.x - B.x) + (b.y - B.y) * (b.y - B.y)) - ((a.x - B.x) * (a.x - B.x) + (a.y - B.y) * (a.y - B.y)) || a.y - b.y || a.x - b.x; });
      for (var oi = 0; oi < order.length && folded < left; oi++) {
        var t = foldBack(order[oi], B, hit);
        if (t) { folds[k(t.x, t.y)] = (folds[k(t.x, t.y)] || 0) + 1; folded++; }
      }
    }
    var lost = S.vent ? 0 : spillN - Object.keys(pushed).length - folded;
    // Bounce: how many times the blast folds back onto a space (the overflow merely flowing in is none)
    var bounce = {};
    if (blastFx && !S.vent) Object.keys(folds).forEach(function (key) { bounce[key] = folds[key]; });
    var tight = tightest(), eff = Math.max(0, tight - (S.pressure ? 1 : 0)), width = areaWidth();
    var extra = sealed ? Math.min(S.dice, Math.max(0, width - eff)) : 0;
    var dice = S.dice + extra, dmg = dice + "d" + S.die;
    var people = [];
    Object.keys(S.items).forEach(function (key) {
      var it = S.items[key]; if (it.kind !== "ally" && it.kind !== "foe") return;
      var p = key.split(":"), c = { x: +p[0], y: +p[1] };
      var caught = !!hit[key], cover = null;
      if (caught && !(c.x === B.x && c.y === B.y)) {
        between(B, c).forEach(function (s) { var o = S.items[k(s.x, s.y)]; if (o && (o.kind === "three" || (o.kind === "half" && cover !== "three"))) cover = o.kind; });
      }
      people.push({ key: key, x: c.x, y: c.y, kind: it.kind, n: it.n, name: (it.kind === "ally" ? "ALLY " : "FOE ") + it.n, caught: caught, behind: !!behind[key], cover: cover, bounce: caught ? (bounce[key] || 0) : 0 });
    });
    people.sort(function (a, b) { return a.kind === b.kind ? a.n - b.n : (a.kind === "foe" ? -1 : 1); });
    return { raw: raw, hit: hit, behind: behind, spill: spill, pushed: pushed, spillN: spillN, lost: lost, folds: folds, folded: folded, bounce: bounce, blastFx: blastFx, sealed: sealed, tight: tight, eff: eff, width: width, extra: extra, dice: dice, dmg: dmg, people: people };
  }
  /* Where the turned-back spaces go (the author, 4 Nov 2026, dictated): n spaces of the blast, as streams.
       1. A stream starts at the blast's edge and runs straight out, a space at a time, until it meets a wall.
       2. At a wall it splashes: it turns left and right along the wall, wherever there is open floor, and runs
          straight on that way until its next wall, where it splashes again.
       3. Cover splits it: a stream that meets cover turns aside round it the same way, and the spaces straight
          behind the cover in that stream's heading, up to the next wall, are sheltered: no stream enters them.
          A cover piece never sends a stream on; one inside the Area shelters the line straight on from the blast
          through it. Two streams reaching one space on the same step both run on through it.
       4. Every stream moves a space per step together, nearest the blast first, until n spaces are filled.
       5. When the streams are spent and spaces are still owed, the rest fills whatever open floor is left (not
          the shadows), nearest first; only when that is full too does it backfill the sheltered spaces behind
          cover. The fill may reach across a sheltered space without filling it. What finds no space at all is
          spent against the walls.
     Returns the spaces filled, keyed. */
  var DIRS4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  function open(x, y, taken) { if (!isFloor(x, y) || taken[k(x, y)]) return false; var it = S.items[k(x, y)]; return !(it && (it.kind === "half" || it.kind === "three")); }
  function push(area, n, B) {
    var out = {}, taken = {}, got = 0;
    if (n <= 0) return out;
    Object.keys(area).forEach(function (key) { taken[key] = 1; });
    function d2(x, y) { return (x - B.x) * (x - B.x) + (y - B.y) * (y - B.y); }
    function isCov(key) { var it = S.items[key]; return !!(it && (it.kind === "half" || it.kind === "three")); }
    /* the shelter: the spaces straight behind a cover piece, in the heading of the stream that meets it, up to
       the next wall; for cover inside the Area (no stream meets it), straight on from the blast through it */
    var shelter = {};
    function shelterBeyond(cx, cy, d) {
      for (var x = cx + d[0], y = cy + d[1]; isFloor(x, y) && !isCov(k(x, y)); x += d[0], y += d[1]) if (!area[k(x, y)]) shelter[k(x, y)] = 1;
    }
    Object.keys(area).forEach(function (key) {
      if (!isCov(key)) return;
      var p = key.split(":"), cx = +p[0], cy = +p[1], dx = cx - B.x, dy = cy - B.y;
      if (Math.abs(dx) >= Math.abs(dy) && dx) shelterBeyond(cx, cy, [dx > 0 ? 1 : -1, 0]);
      if (Math.abs(dy) >= Math.abs(dx) && dy) shelterBeyond(cx, cy, [0, dy > 0 ? 1 : -1]);
    });
    function free(x, y) { return open(x, y, taken) && !shelter[k(x, y)]; }
    function claim(x, y) { var kk = k(x, y); out[kk] = { x: x, y: y }; taken[kk] = 1; got++; }
    // 1 to 4: the streams. Each is { x, y (the space it stands on), d (its heading), moved (spaces it has run) }
    var streams = [];
    Object.keys(area).forEach(function (key) {
      if (isCov(key)) return;
      var p = key.split(":"), x0 = +p[0], y0 = +p[1];
      DIRS4.forEach(function (d) { if (!area[k(x0 + d[0], y0 + d[1])]) streams.push({ x: x0, y: y0, d: d, moved: 0, first: true }); });
    });
    var guard = 0;
    while (got < n && streams.length && guard++ < 4000) {
      var moves = [], next = [], nowClaimed = {};
      streams.forEach(function (st) { var x = st.x + st.d[0], y = st.y + st.d[1]; moves.push({ st: st, x: x, y: y, d: d2(x, y) }); });
      moves.sort(function (a, b) { return a.d - b.d || a.y - b.y || a.x - b.x; });
      moves.forEach(function (m) {
        var st = m.st, mk = k(m.x, m.y);
        if (got >= n) return;
        if (free(m.x, m.y)) { claim(m.x, m.y); nowClaimed[mk] = 1; st.x = m.x; st.y = m.y; st.moved++; next.push(st); return; }
        // two streams into one space on the same step: the second runs on through it, keeping its own line
        if (nowClaimed[mk]) { st.x = m.x; st.y = m.y; st.moved++; next.push(st); return; }
        // cover splits the stream and shelters the line straight behind it
        if (isCov(mk)) shelterBeyond(m.x, m.y, st.d);
        // blocked (a wall, cover, a filled space): a stream that has run splashes left and right from where it
        // stands; one blocked at its very start against a wall has nowhere to splash
        if (st.first && st.moved === 0 && !isCov(mk)) return;
        [[st.d[1], st.d[0]], [-st.d[1], -st.d[0]]].forEach(function (pd) {
          if (free(st.x + pd[0], st.y + pd[1])) next.push({ x: st.x, y: st.y, d: pd, moved: 0, first: false });
        });
      });
      streams = next;
    }
    /* 5: whatever open floor is left, nearest first (reaching across sheltered spaces without filling them), then
       the sheltered spaces themselves */
    [false, true].forEach(function (backfill) {
      var front = Object.keys(taken).filter(function (key) { return !isCov(key); }).map(function (key) { var p = key.split(":"); return { x: +p[0], y: +p[1] }; });
      var vis = {};
      while (got < n && front.length) {
        var layer = [];
        front.forEach(function (c) { DIRS4.forEach(function (d) {
          var x = c.x + d[0], y = c.y + d[1], kk = k(x, y);
          if (!vis[kk] && open(x, y, taken)) { vis[kk] = 1; layer.push({ x: x, y: y, d: d2(x, y), sh: !!shelter[kk] }); }
        }); });
        layer.sort(function (a, b) { return a.d - b.d || a.y - b.y || a.x - b.x; });
        for (var q = 0; q < layer.length && got < n; q++) if (backfill || !layer[q].sh) claim(layer[q].x, layer[q].y);
        front = layer;
      }
    });
    return out;
  }
  /* A space of the Area that lands in a wall, mirrored back across that wall into the room: the wall is the first
     non-floor space on the straight line from the blast; the mirror is taken across the boundary the line crossed
     (again if the mirror lands in a wall too). Lands on a space already caught; failing that, on the last floor
     space before the wall. */
  function foldBack(s, B, caught) {
    var cur = { x: s.x, y: s.y }, firstF = null;
    for (var n = 0; n < 6; n++) {
      var path = between(B, cur).concat([cur]), f = { x: B.x, y: B.y }, w = null;
      for (var i = 0; i < path.length; i++) { if (!isFloor(path[i].x, path[i].y)) { w = path[i]; break; } f = path[i]; }
      if (!firstF) firstF = f;
      if (!w) break;
      // mirror only across the face the line crossed: a diagonal step into the wall flips both axes only at a true corner
      var mx = w.x !== f.x, my = w.y !== f.y;
      if (mx && my) { var ox = !isFloor(w.x, f.y), oy = !isFloor(f.x, w.y); if (ox || oy) { mx = ox; my = oy; } }
      cur = { x: mx ? f.x + w.x - cur.x : cur.x, y: my ? f.y + w.y - cur.y : cur.y };
    }
    function ok(c) { var kk = k(c.x, c.y), it = S.items[kk]; return isFloor(c.x, c.y) && caught[kk] && !(it && (it.kind === "half" || it.kind === "three")); }
    if (ok(cur)) return cur;
    return firstF && ok(firstF) ? firstF : null;   // never onto cover; nowhere at all = the next overflow space takes the turn
  }
  function coverName(c) { return c === "three" ? "Three-Quarter Cover" : "Half Cover"; }
  function coverShort(c) { return c === "three" ? "3/4 Cover" : "1/2 Cover"; }
  // what one caught body rolls, as callout lines (short) and as a sentence (the list under the map)
  function verdict(P, R) {
    if (!R.blastFx) return { lines: [P.name, "in the cloud"], text: P.name + ": in the cloud. A lingering cloud doesn't rebound; it simply fills the space." };
    var save = S.save + " Save" + (R.sealed ? ", Snag" : ""), agi = S.save === "Agility", bonus = P.cover === "three" ? 5 : 2;
    var cov = P.cover ? (R.sealed || !agi ? coverShort(P.cover) + ": no bonus" : coverShort(P.cover) + ": +" + bonus) : null;
    // Bounce dice: one die of the blast's own damage per Bounce, capped at its normal dice (apart from Rebound's cap)
    var bd = Math.min(P.bounce || 0, S.dice), total = R.dice + bd;
    var dmgLine = R.dmg + (bd ? " + " + bd + "d" + S.die + " Bounce" : "");
    var dmgText = bd ? total + "d" + S.die + " (" + R.dmg + " + Bounce " + P.bounce + (P.bounce > S.dice ? ", capped at " + S.dice + " dice" : "") + ")" : R.dmg;
    var lines = [P.name + " · " + dmgLine, save]; if (cov) lines.push(cov); if (P.bounce) lines.push("Bounce " + P.bounce);
    var text = P.name + ": " + dmgText + ", " + (S.onSave === "none" ? "none" : "half") + " on a save. " + save.replace(", Snag", " with Snag") + "."
      + (P.cover ? " " + coverName(P.cover) + (R.sealed ? " grants no bonus: the blast never passes anyone by."
        : agi ? " stands between it and the blast: +" + bonus + " to the save." : " grants nothing to a " + S.save + " Save; cover helps only the Agility save.") : "")
      + (P.bounce ? " Bounce " + P.bounce + ": the blast folds back onto it " + (P.bounce === 1 ? "once" : P.bounce + " times") + "; it adds the first " + (bd === 1 ? "Bounce die" : bd + " Bounce dice") + " of the line." : "");
    return { lines: lines, text: text };
  }

  /* ---- the drawing ---------------------------------------------------------------------- */
  function rect(x, y, cls) { return '<rect class="' + cls + '" x="' + ((x - 0.5) * U) + '" y="' + ((y - 0.5) * U) + '" width="' + U + '" height="' + U + '"/>'; }
  function esc(t) { return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function drawSvg(R) {
    var lx = -1, ly = -1, hx = S.w, hy = S.h;
    // past the walls is drawn only when the room vents (sealed, the walls turn it back into the room)
    if (S.vent) Object.keys(R.spill).forEach(function (key) { var c = R.spill[key]; lx = Math.min(lx, c.x); ly = Math.min(ly, c.y); hx = Math.max(hx, c.x); hy = Math.max(hy, c.y); });
    var floor = "", walls = "", area = "", over = "", s = "";
    for (var y = ly; y <= hy; y++) for (var x = lx; x <= hx; x++) {
      var key = k(x, y);
      if (isFloor(x, y)) floor += rect(x, y, "aoe-cell wtw-floor");
      else {
        var nearFloor = false;
        for (var dy = -1; dy <= 1 && !nearFloor; dy++) for (var dx = -1; dx <= 1; dx++) if (isFloor(x + dx, y + dy)) { nearFloor = true; break; }
        if (nearFloor) walls += rect(x, y, "wtw-wall");
      }
      var rb = R.bounce[key] || 0;
      if (R.pushed[key]) { area += rect(x, y, "aoe-cell aoe-hit wtw-hit wtw-pushed"); over += rect(x, y, "wtw-flow"); }
      else if (R.hit[key]) area += rect(x, y, "aoe-cell aoe-hit wtw-hit");
      // Bounce: one red hash, an X for two, an X with a line through it for three, solid red past that
      if (rb && R.hit[key]) over += '<rect class="wtw-spill wtw-rb wtw-rb' + Math.min(rb, 4) + '" data-bounce="' + rb + '" x="' + ((x - 0.5) * U) + '" y="' + ((y - 0.5) * U) + '" width="' + U + '" height="' + U + '"/>';
      else if (R.behind[key]) area += rect(x, y, "wtw-behind");
      else if (R.spill[key] && S.vent) over += rect(x, y, "wtw-vent");
    }
    s += '<defs><pattern id="wtw-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" class="wtw-hatch-line"/></pattern>'
      + '<pattern id="wtw-hatch-flow" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)"><line x1="0" y1="0" x2="0" y2="6" class="wtw-flow-line"/></pattern>'
      + '<pattern id="wtw-hatch2" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M0,0L8,8M8,0L0,8" class="wtw-hatch-line"/></pattern>'
      + '<pattern id="wtw-hatch3" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M0,0L8,8M8,0L0,8M4,0L4,8" class="wtw-hatch-line"/></pattern></defs>';
    var edges = "";
    for (var ey = 0; ey < S.h; ey++) for (var ex = 0; ex < S.w; ex++) {
      if (!isFloor(ex, ey)) continue;
      var L = (ex - 0.5) * U, T = (ey - 0.5) * U, Rr = L + U, Bm = T + U;
      if (!isFloor(ex, ey - 1)) edges += "M" + L + "," + T + "H" + Rr;
      if (!isFloor(ex, ey + 1)) edges += "M" + L + "," + Bm + "H" + Rr;
      if (!isFloor(ex - 1, ey)) edges += "M" + L + "," + T + "V" + Bm;
      if (!isFloor(ex + 1, ey)) edges += "M" + Rr + "," + T + "V" + Bm;
    }
    s += floor + walls + area + over + '<path class="wtw-edge" d="' + edges + '"/>';
    // cover pieces
    Object.keys(S.items).forEach(function (key) {
      var it = S.items[key], p = key.split(":"), x = +p[0] * U, y = +p[1] * U;
      if (it.kind === "half" || it.kind === "three") {
        s += '<g class="wtw-cover wtw-' + it.kind + '"><rect x="' + (x - U * 0.36) + '" y="' + (y - U * 0.36) + '" width="' + (U * 0.72) + '" height="' + (U * 0.72) + '" rx="2"/>'
          + '<text x="' + x + '" y="' + (y + 3) + '">' + (it.kind === "three" ? "3/4" : "1/2") + '</text></g>';
      }
    });
    // the blast
    var bx = S.blast.x * U, by = S.blast.y * U, star = [];
    for (var i = 0; i < 16; i++) { var a = Math.PI / 8 * i, r = i % 2 ? U * 0.17 : U * 0.42; star.push((bx + r * Math.cos(a)).toFixed(1) + "," + (by + r * Math.sin(a)).toFixed(1)); }
    s += '<polygon class="wtw-blast' + (S.cloud ? " wtw-cloud" : "") + '" points="' + star.join(" ") + '"/>';
    // bodies, then their callouts over everything
    /* bodies first; then each caught body's callout, placed where it overlaps the fewest other callouts and
       bodies (above it, below it, to a side, or a corner), and the frame grows to hold every callout */
    var calls = "", boxes = [], vx0 = (lx - 0.5) * U, vy0 = (ly - 0.5) * U, vx1 = (hx + 0.5) * U, vy1 = (hy + 0.5) * U;
    var bodies = R.people.map(function (P) { var r = U * 0.36; return { x: P.x * U - r, y: P.y * U - r, w: 2 * r, h: 2 * r, wt: 1 }; });
    bodies.push({ x: S.blast.x * U - U * 0.42, y: S.blast.y * U - U * 0.42, w: U * 0.84, h: U * 0.84, wt: 3 });
    Object.keys(S.items).forEach(function (key) {
      var it = S.items[key]; if (it.kind !== "half" && it.kind !== "three") return;
      var p = key.split(":"); bodies.push({ x: +p[0] * U - U * 0.36, y: +p[1] * U - U * 0.36, w: U * 0.72, h: U * 0.72, wt: 2 });
    });
    function overlap(a, b) { var ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x), oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y); return ox > 0 && oy > 0 ? ox * oy : 0; }
    R.people.forEach(function (P) {
      var x = P.x * U, y = P.y * U;
      s += '<g class="wtw-tok wtw-' + P.kind + (P.caught ? " wtw-caught" : "") + '" transform="translate(' + x + " " + y + ')"><circle r="' + (U * 0.34) + '"/>'
        + (P.kind === "foe" ? '<path d="M-3.4,-3.4 L3.4,3.4 M3.4,-3.4 L-3.4,3.4"/>' : '<path d="M-3.6,0.4 L-1,3 L3.8,-3"/>') + '</g>';
    });
    R.people.forEach(function (P) {
      if (!P.caught) return;
      var x = P.x * U, y = P.y * U, g = U * 0.42 + 3;
      var lines = verdict(P, R).lines, fs = 6.6, lh = 8, pad = 3;
      var w = Math.max.apply(null, lines.map(function (t) { return t.length; })) * fs * 0.56 + pad * 2, h = lines.length * lh + pad * 2 - 1;
      var spots = [[x - w / 2, y - g - h], [x - w / 2, y + g], [x + g, y - h / 2], [x - g - w, y - h / 2],
                   [x + g - 4, y - g - h], [x - g - w + 4, y - g - h], [x + g - 4, y + g], [x - g - w + 4, y + g]];
      var best = null, bestScore = Infinity;
      spots.forEach(function (sp, i) {
        var b = { x: sp[0], y: sp[1], w: w, h: h }, score = i * 0.5;
        boxes.forEach(function (o) { score += overlap(b, o) * 4; });
        bodies.forEach(function (o) { score += overlap(b, o) * o.wt; });
        if (score < bestScore) { bestScore = score; best = b; }
      });
      boxes.push(best);
      vx0 = Math.min(vx0, best.x - 2); vy0 = Math.min(vy0, best.y - 2); vx1 = Math.max(vx1, best.x + w + 2); vy1 = Math.max(vy1, best.y + h + 2);
      calls += '<g class="wtw-call wtw-call-' + P.kind + '" data-wtw-call="' + P.key + '"><rect x="' + best.x.toFixed(1) + '" y="' + best.y.toFixed(1) + '" width="' + w.toFixed(1) + '" height="' + h + '" rx="2"/>'
        + lines.map(function (t, j) { return '<text x="' + (best.x + pad).toFixed(1) + '" y="' + (best.y + pad + 6 + j * lh).toFixed(1) + '"' + (j === 0 ? ' class="wtw-call-h"' : "") + '>' + esc(t) + '</text>'; }).join("") + '</g>';
    });
    s += calls;
    s += '<rect class="wtw-cur" x="' + ((S.cur.x - 0.5) * U + 1) + '" y="' + ((S.cur.y - 0.5) * U + 1) + '" width="' + (U - 2) + '" height="' + (U - 2) + '"/>';
    /* a drag holds the frame still (a growing spill or a new callout would otherwise move the room under the
       pointer); the end of the drag refits it */
    if (_gest && _gest.moved && _gest.frame) { vx0 = _gest.frame[0]; vy0 = _gest.frame[1]; vx1 = _gest.frame[2]; vy1 = _gest.frame[3]; }
    else if (_gest) _gest.frame = [vx0, vy0, vx1, vy1];
    var vx = vx0, vy = vy0, vw = vx1 - vx0, vh = vy1 - vy0;
    var label = "Wall-to-Wall: a " + (S.shape === "l" ? "L-shaped room " : "room ") + S.w + " by " + S.h + ", Area " + S.size + " " + S.area + ", " + R.people.filter(function (p) { return p.caught; }).length + " caught";
    var maxW = Math.round(vw / U * 44), minW = Math.min(maxW, Math.round(vw * 1.4));
    return '<svg class="aoe-svg wtw-svg" style="overflow:visible;max-width:' + maxW + 'px;min-width:' + minW + 'px" viewBox="' + vx + " " + vy + " " + vw + " " + vh + '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' + esc(label) + '">' + s + "</svg>";
  }

  /* ---- the widget ----------------------------------------------------------------------- */
  function lab(t) { return el("span", { style: { display: "block", fontFamily: "var(--mono)", fontSize: "9px", letterSpacing: ".18em", color: "var(--text3)", marginBottom: "4px" }, text: t }); }
  function field(t, ctl) { return el("label", { style: { display: "block" } }, [lab(t), ctl]); }
  function num(v, min, max, set, lazy) {
    return el("input", { type: "number", min: String(min), max: String(max), value: String(v), style: { width: "100%" },
      oninput: function () { if (lazy) return; var n = parseInt(this.value, 10); if (n >= min && n <= max) { set(n); redraw(); } },
      onchange: function () { var n = Math.max(min, Math.min(max, parseInt(this.value, 10) || min)); this.value = String(n); set(n); redraw(); } });
  }
  // a chip that is a switch; the inline cursor keeps #GRIDroid's tap floor even (see aoegrid.js gridChip)
  function toggle(label, title, get, set, data) {
    var b = el("button.chip", { type: "button", style: { cursor: "pointer" }, title: title, dataset: { wtw: data },
      onclick: function () { set(!get()); redraw(); } }, label);
    b._sync = function () { var on = !!get(); b.classList.toggle("on", on); b.setAttribute("aria-pressed", on ? "true" : "false"); };
    return b;
  }
  var _stage = null, _parts = null, _gest = null;
  function redraw() { if (_parts) _parts.draw(); }

  function cellAt(ev) {
    var svg = _stage && _stage.querySelector("svg"); if (!svg || !svg.getScreenCTM) return null;
    var m = svg.getScreenCTM(); if (!m) return null;
    var p = svg.createSVGPoint(); p.x = ev.clientX; p.y = ev.clientY;
    var q = p.matrixTransform(m.inverse());
    return { x: Math.round(q.x / U), y: Math.round(q.y / U) };
  }
  // what a tap with the current tool does on a floor space
  function apply(c) {
    if (!isFloor(c.x, c.y)) return false;
    var key = k(c.x, c.y), it = S.items[key];
    if (S.tool === "blast") { S.blast = { x: c.x, y: c.y }; return true; }
    if (S.tool === "erase") { if (!it) return false; delete S.items[key]; return true; }
    if (it && it.kind === S.tool) { delete S.items[key]; return true; }   // the same tool again lifts it
    put(c.x, c.y, S.tool); return true;
  }
  // what a drag picks up: the blast when the press is on it, else the thing on that space
  function grab(c) {
    if (S.tool === "erase") return null;
    if (S.blast.x === c.x && S.blast.y === c.y && (S.tool === "blast" || !S.items[k(c.x, c.y)])) return { blast: true };
    var key = k(c.x, c.y); if (S.items[key]) return { key: key };
    return S.tool === "blast" ? { blast: true, jump: true } : null;
  }
  function moveTo(g, c) {
    if (!isFloor(c.x, c.y)) return false;
    if (g.blast) { if (S.blast.x === c.x && S.blast.y === c.y) return false; S.blast = { x: c.x, y: c.y }; return true; }
    var to = k(c.x, c.y); if (to === g.key || S.items[to]) return false;
    S.items[to] = S.items[g.key]; delete S.items[g.key]; g.key = to; return true;
  }
  function bind(st) {
    st.addEventListener("pointerdown", function (ev) {
      if (ev.button != null && ev.button !== 0) return;
      if (ev.pointerType === "touch") st.classList.add("aoe-engaged");
      var c = cellAt(ev); if (!c) return;
      ev.preventDefault();
      if (_gest && _gest.id !== ev.pointerId) { _gest.moved = true; return; }   // a second finger: ignored, and the first is no tap
      _gest = { id: ev.pointerId, s0: { x: ev.clientX, y: ev.clientY }, c0: c, g: grab(c), moved: false };
    });
    st.addEventListener("keydown", function (ev) {
      if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); if (apply(S.cur)) redraw(); return; }
      var d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[ev.key]; if (!d) return;
      ev.preventDefault();
      var from = S.tool === "blast" ? S.blast : S.cur, c = { x: from.x + d[0], y: from.y + d[1] };   // with BLAST picked, from the blast itself
      if (!isFloor(c.x, c.y)) return;
      S.cur = c; if (S.tool === "blast") S.blast = { x: c.x, y: c.y };
      redraw();
    });
  }
  document.addEventListener("pointermove", function (ev) {
    var G = _gest; if (!G || ev.pointerId !== G.id) return;
    if (!G.moved && Math.sqrt(Math.pow(ev.clientX - G.s0.x, 2) + Math.pow(ev.clientY - G.s0.y, 2)) > SLOP) G.moved = true;
    if (!G.moved || !G.g) return;
    var c = cellAt(ev); if (c && moveTo(G.g, c)) redraw();
  });
  function end(ev) {
    var G = _gest; if (!G || ev.pointerId !== G.id) return;
    _gest = null;
    if (G.moved) redraw();
    else if (ev.type === "pointerup" && apply(G.c0)) redraw();
  }
  document.addEventListener("pointerup", end);
  document.addEventListener("pointercancel", end);
  document.addEventListener("pointerdown", function (ev) {
    var box = _stage && (_stage.closest(".wtw-widget") || _stage);   // a tool chip keeps the room engaged
    if (box && !box.contains(ev.target)) _stage.classList.remove("aoe-engaged");
  }, true);

  function build() {
    if (!EN.aoeGrid || !EN.aoeGrid.cellsAt) return null;
    settle();
    var stage = el("div.aoe-box.aoe-stage.wtw-stage", { tabindex: "0", "aria-label": "The room. Arrow keys move the cursor; Enter or Space uses the tool." });
    var read = el("div.wtw-read"), list = el("ul.wtw-list");
    var syncs = [];

    // the room
    var presetRow = el("div.row.wrap.wtw-presets", { style: { gap: "6px" } }, PRESETS.map(function (p) {
      return el("button.chip", { type: "button", style: { cursor: "pointer" }, dataset: { wtwPreset: p.key }, title: (p.shape === "l" ? "An L-shaped hall " : "") + p.w + " by " + p.h + " spaces",
        onclick: function () { S.shape = p.shape; S.w = p.w; S.h = p.h; if (p.arm) S.arm = p.arm; syncInputs(); redraw(); } }, p.label);
    }));
    var shapeSel = el("select", { style: { width: "100%" }, onchange: function () { S.shape = this.value; redraw(); } }, [
      el("option", { value: "rect", text: "Rectangle" }), el("option", { value: "l", text: "L-shaped" })]);
    // lazy: the room's size commits on change (blur, Enter, a spinner step), so typing 10 never passes through a room 1 wide
    var wIn = num(S.w, 1, MAXR, function (n) { S.w = n; }, true), hIn = num(S.h, 1, MAXR, function (n) { S.h = n; }, true), armIn = num(S.arm, 1, MAXR, function (n) { S.arm = n; }, true);
    var armField = field("ARM WIDTH", armIn);
    var roomGrid = el("div.wtw-ctl", null, [field("SHAPE", shapeSel), field("WIDTH", wIn), field("LENGTH", hIn), armField]);
    function syncInputs() { shapeSel.value = S.shape; wIn.value = String(S.w); hIn.value = String(S.h); armIn.value = String(S.arm); }

    // the blast
    var areaSel = el("select", { style: { width: "100%" }, onchange: function () { S.area = this.value; redraw(); } }, [
      el("option", { value: "sphere", text: "Sphere (radius)" }), el("option", { value: "cube", text: "Cube (edge)" })]);
    var sizeIn = num(S.size, 1, MAXA, function (n) { S.size = n; }), diceIn = num(S.dice, 1, 20, function (n) { S.dice = n; });
    var dieSel = el("select", { style: { width: "100%" }, onchange: function () { S.die = parseInt(this.value, 10); redraw(); } },
      [4, 6, 8, 10, 12].map(function (d) { return el("option", { value: String(d), text: "d" + d }); }));
    var saveSel = el("select", { style: { width: "100%" }, onchange: function () { S.save = this.value; redraw(); } },
      ["Agility", "Body", "Wits", "Presence", "Mystique"].map(function (a) { return el("option", { value: a, text: a + " Save" }); }));
    var onSaveSel = el("select", { style: { width: "100%" }, onchange: function () { S.onSave = this.value; redraw(); } }, [
      el("option", { value: "half", text: "Half damage" }), el("option", { value: "none", text: "No damage" })]);
    var blastGrid = el("div.wtw-ctl", null, [field("AREA", areaSel), field("SIZE", sizeIn), field("DICE", diceIn), field("DIE", dieSel), field("SAVE", saveSel), field("ON A SAVE", onSaveSel)]);
    var tg = [
      toggle("VENTED", "A blown-out wall, an open roof, or a doorway wide enough to bleed off the pressure: none of Wall-to-Wall applies", function () { return S.vent; }, function (v) { S.vent = v; }, "vent"),
      toggle("PRESSURE", "The Pressure trait: the room counts one space narrower for Rebound", function () { return S.pressure; }, function (v) { S.pressure = v; }, "pressure"),
      toggle("LINGERING CLOUD", "Smoke or gas: it doesn't rebound; it simply fills the space", function () { return S.cloud; }, function (v) { S.cloud = v; }, "cloud")
    ];
    syncs = syncs.concat(tg);

    // the tools
    var TOOLS = [["blast", "BLAST"], ["foe", "FOE"], ["ally", "ALLY"], ["half", "HALF COVER"], ["three", "3/4 COVER"], ["erase", "ERASE"]];
    var toolBtns = TOOLS.map(function (t) {
      var b = el("button.chip", { type: "button", style: { cursor: "pointer" }, dataset: { wtwTool: t[0] }, title: t[0] === "blast" ? "Tap where it goes off" : t[0] === "erase" ? "Tap a thing to take it away" : "Tap a space to put one down; tap it again to lift it",
        onclick: function () { S.tool = t[0]; redraw(); } }, t[1]);
      b._sync = function () { var on = S.tool === t[0]; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on ? "true" : "false"); };
      return b;
    });
    syncs = syncs.concat(toolBtns);
    var clearBtn = el("button.chip", { type: "button", style: { cursor: "pointer" }, dataset: { wtw: "clear" }, title: "Take every body and cover piece away",
      onclick: function () { S.items = {}; S.next = { ally: 1, foe: 1 }; redraw(); } }, "CLEAR");

    function draw() {
      settle();
      var R = scene();
      stage.innerHTML = drawSvg(R);
      armField.style.display = S.shape === "l" ? "" : "none";
      areaSel.value = S.area; dieSel.value = String(S.die); saveSel.value = S.save; onSaveSel.value = S.onSave;
      syncs.forEach(function (b) { b._sync(); });
      stage.setAttribute("data-tool", S.tool);
      // the arithmetic, in the book's words
      clear(read);
      var shapeName = S.area === "cube" ? "Cube" : "Sphere";
      var lines = [];
      lines.push("Area " + S.size + " " + shapeName + ": " + R.width + " space" + (R.width === 1 ? "" : "s") + " wide. The room's tightest open dimension: " + R.tight + (S.pressure && R.blastFx && !S.vent ? " (Pressure counts it as " + R.eff + ")" : "") + ".");
      if (!R.blastFx) lines.push("A lingering cloud doesn't rebound; it simply fills the space. No extra dice, no Snag, cover as usual.");
      else if (S.vent) lines.push("Vented: Wall-to-Wall doesn't apply. " + S.dice + "d" + S.die + ", and cover counts as usual"
        + (S.save === "Agility" ? " (+2 for Half Cover, +5 for Three-Quarter, on the Agility save, when it stands between a target and the blast)." : ", which on a " + S.save + " Save is nothing: cover helps only the Agility save.")
        + " A wall between a space and the blast keeps it out of reach.");
      else {
        lines.push(R.extra > 0
          ? "Rebound: " + R.width + " is " + Math.max(0, R.width - R.eff) + " wider than " + R.eff + ", so +" + R.extra + " " + (R.extra === 1 ? "die" : "dice") + (R.width - R.eff > S.dice ? " (no more than its own " + S.dice + ")" : "") + ": " + S.dice + "d" + S.die + " becomes " + R.dmg + "."
          : "Rebound: the room holds it, so no extra dice: " + R.dmg + ".");
        lines.push("Sealed: everyone caught saves with Snag, and Half and Three-Quarter Cover grant no bonus.");
      }
      if (!S.vent && R.spillN > 0) {
        var pn = Object.keys(R.pushed).length;
        lines.push("The walls turn back " + R.spillN + " space" + (R.spillN === 1 ? "" : "s") + " of the Area. "
          + (pn ? (pn === R.spillN ? "They fill" : pn + " of them fill") + " the open room (hatched in the template's own colour, not red): straight out until a wall, then splashing along it; cover splits the flow and shelters the spaces behind it, which fill only once the rest of the room is full. Anyone in those spaces is caught too." : "")
          + (R.folded > 0 ? (pn ? " " : "") + R.folded + " find" + (R.folded === 1 ? "s" : "") + " no open space and fold" + (R.folded === 1 ? "s" : "") + " back into the blast, off the wall " + (R.folded === 1 ? "it" : "each") + " hit, onto the spaces already caught. Each time is a Bounce: a red hash for one, an X for two, an X with a line through it for three, solid red for four or more. A target adds one die of the blast's damage per Bounce on its space, up to " + S.dice + " (its own dice); roll the Bounce dice once, in a line, and a target with 2 Bounces adds the first two." : "")
          + (R.lost > 0 ? " " + R.lost + " find" + (R.lost === 1 ? "s" : "") + " nowhere at all and " + (R.lost === 1 ? "is" : "are") + " spent against the walls." : ""));
      }
      lines.forEach(function (t, i) { read.appendChild(el("p" + (i === 0 ? ".wtw-sum" : ""), { text: t })); });
      var caught = R.people.filter(function (p) { return p.caught; });
      clear(list);
      if (!R.people.length) list.appendChild(el("li", { text: "No one in the room yet: pick FOE or ALLY and tap a space." }));
      else if (!caught.length) list.appendChild(el("li", { text: "No one is caught." }));
      caught.forEach(function (P) { list.appendChild(el("li", { dataset: { wtwWho: P.key }, text: verdict(P, R).text })); });
      var walled = R.people.filter(function (p) { return !p.caught && p.behind; }), clearOnes = R.people.filter(function (p) { return !p.caught && !p.behind; });
      if (walled.length) list.appendChild(el("li.wtw-clear", { text: "Behind a wall, out of the blast's reach: " + walled.map(function (p) { return p.name; }).join(", ") + "." }));
      if (clearOnes.length && (caught.length || walled.length)) list.appendChild(el("li.wtw-clear", { text: "Clear of the Area: " + clearOnes.map(function (p) { return p.name; }).join(", ") + "." }));
    }

    _stage = stage; _parts = { draw: draw };
    bind(stage);
    syncInputs();
    draw();
    return el("div.wtw-widget", null, [
      el("div.row.between.wrap", { style: { gap: "8px", marginBottom: "8px", alignItems: "center" } }, [el("span.mono.wtw-h", { text: "// ROOM" }), presetRow]),
      roomGrid,
      el("div.row.between.wrap", { style: { gap: "8px", margin: "4px 0 8px", alignItems: "center" } }, [el("span.mono.wtw-h", { text: "// BLAST" }), el("div.row.wrap", { style: { gap: "6px" } }, tg)]),
      blastGrid,
      el("div.row.wrap.wtw-tools", { style: { gap: "6px", alignItems: "center", margin: "4px 0 8px" } }, [el("span.mono.wtw-h", { text: "PLACE" })].concat(toolBtns, [clearBtn])),
      stage,
      read,
      list,
      el("p.help.aoe-hint", { text: "Pick a tool and tap the room: BLAST sets where it goes off, FOE, ALLY and the covers put one down (tap it again to lift it), ERASE takes one away. Drag anything to move it. On a phone, tap the room once before dragging up or down. From the keyboard, the arrow keys move a cursor round the room (and the blast, with BLAST picked), and Enter or Space uses the tool there." }),
      el("p.help", { style: { margin: "6px 0 0", fontStyle: "italic" },
        text: "How this diagram reads the rule: the Area is the Codex template's, centered on the space where the blast goes off. Sealed, it reaches every space of the Area in the room, round an L's corner too, since the pressure fills every corner; vented, a space with a wall between it and the blast isn't caught. The spaces that land in a wall are turned back into the room (hatched in the template's own colour; red is only for a Bounce): they run straight out from the blast until they hit a wall, then splash left and right along it and run on to the next. Cover splits the flow and shelters the spaces behind it; those fill only when every other open space is full and the blast still has more to give. What finds no space at all folds back into the blast, mirrored off the wall it hit onto the spaces already caught; each time is a Bounce (one red hash, an X for two, an X with a line through it for three, solid red for four or more), and each Bounce adds a die of the blast's damage, up to its own dice. The room's tightest open dimension is its narrowest width, an L's arm. Cover counts when its space lies on the straight line from the blast to the target, and only for an Agility save. Set the save and what it does from the weapon's own entry. Borderline calls are the GM's." })
    ]);
  }

  // the arithmetic on its own, for tests and for anyone else who wants it
  function rebound(o) {
    var width = o.area === "cube" ? o.size : 2 * o.size + 1, eff = Math.max(0, o.tightest - (o.pressure ? 1 : 0));
    var extra = Math.min(o.dice, Math.max(0, width - eff));
    return { width: width, effective: eff, extra: extra, dice: o.dice + extra };
  }
  return { build: build, rebound: rebound, state: function () { return S; } };
})();
