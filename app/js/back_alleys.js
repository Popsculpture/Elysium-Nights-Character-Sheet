/* Back Alleys: maze screen saver for #GRIDOS '98.
   Use: const saver = BackAlleys.create(canvas, data, { mapCanvas, reducedMotion });
        saver.ready.then(...); saver.stop() when the screen saver closes.
   data is the parsed back-alleys-data.json. The canvas is drawn at 418 x 236; size it with CSS. */
function createBackAlleys(cv, DATA, opts) {
"use strict";
opts = opts || {};
const W = 418, H = 236, P = 0.66, S = (W / 2) / P, WH = 2.0, EYE = 0.66, HOR = 122, TW = 64, TH = 128;
const AMB = [.19, .21, .38], FOG = [20, 15, 40], FK = .10, LM = 4;
cv.width = 418; cv.height = 236; const ctx = cv.getContext("2d");
const frame = ctx.createImageData(W, H), px = frame.data, buf = new Float32Array(W * H * 3), zb = new Float32Array(W);
const off = document.createElement("canvas"); off.width = W; off.height = H; const octx = off.getContext("2d");
const reduce = opts.reducedMotion !== undefined ? !!opts.reducedMotion : !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
const NAMES = DATA.names, NT = NAMES.length, TI = {}; NAMES.forEach((n, i) => TI[n] = i);
const PLAIN = ["brick", "brick", "brick2", "brick3", "conc", "brick", "brick2", "brick_pipe"].map(n => TI[n]);
const SPICE = ["win_warm", "win_cyan", "door", "shutter", "g_finders", "g_dontask", "g_getpaid", "g_gearup", "s_fury", "s_stitcher", "s_code", "s_shaper", "s_scoundrel", "s_hustler", "posters", "poster_nd", "poster_gs", "g_receipts", "g_grid", "noodles", "open", "24hr", "pawn", "door_exit", "win_warm", "win_cyan", "door", "ember", "mural_grid", "noodles", "open", "24hr", "pawn", "win_warm", "win_cyan", "door", "ember"].map(n => TI[n]);
let atlas, sheet, SPR = {};

function loadImg(src) { return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; }); }
function pixels(img) { const c = document.createElement("canvas"); c.width = img.width; c.height = img.height; const x = c.getContext("2d"); x.drawImage(img, 0, 0); return x.getImageData(0, 0, img.width, img.height); }

// ---------- random
let seed = (Date.now() ^ 0x9e3779b9) >>> 0;
function rnd() { seed ^= seed << 13; seed >>>= 0; seed ^= seed >>> 17; seed ^= seed << 5; seed >>>= 0; return seed / 4294967296; }
function ri(n) { return Math.floor(rnd() * n); }
function hash3(a, b, c, s) { let h = (a * 374761393 + b * 668265263 + c * 2147483647 + s * 1274126177) >>> 0; h = ((h ^ (h >>> 13)) * 1274126177) >>> 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
function hsh(a) { const v = Math.sin(a * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); }
function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const r = (a, b) => hsh(a * 12.9898 + b * 78.233);
  return (r(xi, yi) * (1 - u) + r(xi + 1, yi) * u) * (1 - v) + (r(xi, yi + 1) * (1 - u) + r(xi + 1, yi + 1) * u) * v;
}

// ---------- maze
const N = 11, STRAIGHT = .86, MW = 2 * N + 1, MH = 2 * N + 1;
let grid, mseed, ovr, lmR, lmG, lmB, manholes, ents, props, start, finish, sealed, tell = null, nextTell = 0;
const DX = [1, 0, -1, 0], DY = [0, 1, 0, -1], FACE = ["W", "N", "E", "S"]; // face of the wall cell you hit when moving in dir d
function solid(x, y) { return x < 0 || y < 0 || x >= MW || y >= MH || grid[y * MW + x] === 1; }
function faceTex(mx, my, f) {
  const k = mx + "," + my + "," + f; if (ovr[k] !== undefined) return ovr[k];
  const fi = "WENS".indexOf(f);
  if (hash3(mx, my, fi, mseed) < .44) return SPICE[Math.floor(hash3(my, mx, fi + 9, mseed) * SPICE.length)];
  return PLAIN[Math.floor(hash3(mx + 3, my + 5, fi, mseed) * PLAIN.length)];
}
function faceOpen(mx, my, f) { return f === "W" ? [mx - 1, my] : f === "E" ? [mx + 1, my] : f === "N" ? [mx, my - 1] : [mx, my + 1]; }
function los(ax, ay, bx, by) {
  const n = Math.floor(Math.max(Math.abs(bx - ax), Math.abs(by - ay)) * 10) + 1;
  for (let i = 0; i <= n; i++) { const t = i / n; if (solid(Math.floor(ax + (bx - ax) * t), Math.floor(ay + (by - ay) * t))) return false; }
  return true;
}
function openNeighbors(x, y) { const o = []; for (let d = 0; d < 4; d++) if (!solid(x + DX[d], y + DY[d])) o.push(d); return o; }
function newMaze() {
  mseed = ri(1e6); grid = new Uint8Array(MW * MH).fill(1); ovr = {};
  const stack = [[1, 1, -1]]; grid[MW + 1] = 0;
  while (stack.length) {
    const [x, y, pd] = stack[stack.length - 1], opts = [];
    for (let d = 0; d < 4; d++) { const nx = x + DX[d] * 2, ny = y + DY[d] * 2; if (nx > 0 && ny > 0 && nx < MW - 1 && ny < MH - 1 && grid[ny * MW + nx] === 1) opts.push(d); }
    if (!opts.length) { stack.pop(); continue; }
    const d = (opts.includes(pd) && rnd() < STRAIGHT) ? pd : opts[ri(opts.length)]; grid[(y + DY[d]) * MW + x + DX[d]] = 0; grid[(y + DY[d] * 2) * MW + x + DX[d] * 2] = 0; stack.push([x + DX[d] * 2, y + DY[d] * 2, d]);
  }
  // distances from start, finish at the farthest cell
  start = [1, 1]; const dist = new Int32Array(MW * MH).fill(-1); dist[MW + 1] = 0; const q = [[1, 1]]; let far = [1, 1];
  while (q.length) { const [x, y] = q.shift(); if (dist[y * MW + x] > dist[far[1] * MW + far[0]]) far = [x, y]; for (const d of openNeighbors(x, y)) { const nx = x + DX[d], ny = y + DY[d]; if (dist[ny * MW + nx] < 0) { dist[ny * MW + nx] = dist[y * MW + x] + 1; q.push([nx, ny]); } } }
  finish = far;
  // start sign: JACK IN on a wall of the start cell, ahead if possible
  const sd = openNeighbors(1, 1)[0]; let placed = false;
  for (const d of [(sd + 3) % 4, (sd + 1) % 4, (sd + 2) % 4]) { const wx = 1 + DX[d], wy = 1 + DY[d]; if (solid(wx, wy) && !placed) { ovr[wx + "," + wy + "," + FACE[d]] = TI["jackin"]; placed = true; } }
  // lists of cells
  const open = [], dead = [];
  for (let y = 1; y < MH - 1; y++) for (let x = 1; x < MW - 1; x++) if (!solid(x, y)) { if (x === 1 && y === 1) continue; if (x === finish[0] && y === finish[1]) continue; (openNeighbors(x, y).length === 1 ? dead : open).push([x, y]); }
  const take = (arr) => arr.splice(ri(arr.length), 1)[0];
  ents = []; props = []; sealed = {}; manholes = {};
  for (let i = 0; i < 11; i++) { const c = take(open); ents.push({ kind: "rat", x: c[0] + .5, y: c[1] + .5, cx: c[0], cy: c[1], d: -1, t: 1, lat: (rnd() - .5) * .5, sp: 2 + rnd() * 1.2 }); }
  for (let i = 0; i < 3; i++) { const c = take(open); ents.push({ kind: "alert", x: c[0] + .5, y: c[1] + .5, ph: rnd() * 6 }); }
  for (let i = 0; i < 2; i++) { const c = take(open); ents.push({ kind: "analyze", x: c[0] + .5, y: c[1] + .5, cx: c[0], cy: c[1], ph: rnd() * 6 }); }
  for (let i = 0; i < 2; i++) { const c = take(open); ents.push({ kind: "adaptive", x: c[0] + .5, y: c[1] + .5, cx: c[0], cy: c[1], d: -1, t: 1, ph: rnd() * 6 }); }
  for (let i = 0; i < 2 && dead.length; i++) { const c = take(dead); ents.push({ kind: "aggressive", x: c[0] + .5, y: c[1] + .5, cx: c[0], cy: c[1], ph: rnd() * 6 }); sealed[c[0] + "," + c[1]] = true; }
  for (let i = 0; i < 2; i++) { const c = take(open); ents.push({ kind: "fidget", x: c[0] + .5, y: c[1] + .5, cx: c[0], cy: c[1], ph: rnd() * 6, alive: true }); }
  for (let i = 0; i < 3; i++) { const c = take(open); ents.push({ kind: "gizmo", x: c[0] + .5, y: c[1] + .5, cx: c[0], cy: c[1], ph: rnd() * 6 }); }
  ents.push({ kind: "grid", x: finish[0] + .5, y: finish[1] + .5, ph: 0 });
  for (let i = 0; i < 9 && open.length; i++) { const c = take(open), ws = []; for (let d = 0; d < 4; d++) if (solid(c[0] + DX[d], c[1] + DY[d])) ws.push(d); if (!ws.length) continue; const d = ws[ri(ws.length)]; props.push({ kind: rnd() < .6 ? "bags" : "dumpster", x: c[0] + .5 + DX[d] * .27, y: c[1] + .5 + DY[d] * .27 }); }
  for (let i = 0; i < 8 && open.length; i++) { const c = open[ri(open.length)]; manholes[c[0] + "," + c[1]] = true; }
  buildLight(); tell = null; nextTell = 9 + rnd() * 6;
}
function buildLight() {
  const lights = [];
  for (let my = 0; my < MH; my++) for (let mx = 0; mx < MW; mx++) {
    if (!solid(mx, my)) continue;
    for (const f of "WENS") {
      const [ox, oy] = faceOpen(mx, my, f); if (solid(ox, oy)) continue;
      for (const [u, z, col, I] of DATA.lights[NAMES[faceTex(mx, my, f)]]) {
        const uu = (f === "E" || f === "N") ? 1 - u : u; let lx, ly;
        if (f === "W") { lx = mx - .22; ly = my + uu; } else if (f === "E") { lx = mx + 1.22; ly = my + uu; } else if (f === "N") { lx = mx + uu; ly = my - .22; } else { lx = mx + uu; ly = my + 1.22; }
        lights.push([lx, ly, z, col, I]);
      }
    }
  }
  const lw = MW * LM, lh = MH * LM; lmR = new Float32Array(lw * lh); lmG = new Float32Array(lw * lh); lmB = new Float32Array(lw * lh);
  for (let sy = 0; sy < lh; sy++) for (let sx = 0; sx < lw; sx++) {
    const x = (sx + .5) / LM, y = (sy + .5) / LM; if (solid(Math.floor(x), Math.floor(y))) continue;
    let r = 0, g = 0, b = 0;
    for (const [lx, ly, lz, c, I] of lights) {
      const dx = x - lx, dy = y - ly, d2 = dx * dx + dy * dy; if (d2 > 20) continue; if (!los(lx, ly, x, y)) continue;
      const a = .62 * I / (1 + 1.98 * (d2 + lz * lz * .6)); r += a * c[0]; g += a * c[1]; b += a * c[2];
    }
    const i = sy * lw + sx; lmR[i] = r; lmG[i] = g; lmB[i] = b;
  }
  // spread into wall samples so bilinear reads near walls stay lit
  const cR = lmR.slice(), cG = lmG.slice(), cB = lmB.slice();
  for (let sy = 0; sy < lh; sy++) for (let sx = 0; sx < lw; sx++) {
    if (!solid(Math.floor(sx / LM), Math.floor(sy / LM))) continue; let n = 0, r = 0, g = 0, b = 0;
    for (let d = 0; d < 4; d++) { const ax = sx + DX[d], ay = sy + DY[d]; if (ax < 0 || ay < 0 || ax >= lw || ay >= lh || solid(Math.floor(ax / LM), Math.floor(ay / LM))) continue; const j = ay * lw + ax; r += cR[j]; g += cG[j]; b += cB[j]; n++; }
    if (n) { const i = sy * lw + sx; lmR[i] = r / n; lmG[i] = g / n; lmB[i] = b / n; }
  }
}
const lc = [0, 0, 0];
function light(x, y) {
  const lw = MW * LM, fx = Math.min(lw - 1.001, Math.max(0, x * LM - .5)), fy = Math.min(MH * LM - 1.001, Math.max(0, y * LM - .5)), x0 = Math.floor(fx), y0 = Math.floor(fy), u = fx - x0, v = fy - y0, i = y0 * lw + x0;
  const a = (1 - u) * (1 - v), b = u * (1 - v), c = (1 - u) * v, d = u * v;
  lc[0] = lmR[i] * a + lmR[i + 1] * b + lmR[i + lw] * c + lmR[i + lw + 1] * d; lc[1] = lmG[i] * a + lmG[i + 1] * b + lmG[i + lw] * c + lmG[i + lw + 1] * d; lc[2] = lmB[i] * a + lmB[i + 1] * b + lmB[i + lw] * c + lmB[i + lw + 1] * d;
}

// ---------- sky
const skyCache = new Map();
function skyCol(theta) {
  const a = ((theta % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI) / (2 * Math.PI) * 150, k = Math.floor(a), wc = Math.floor((a - k) * 4), key = k * 4 + wc;
  let col = skyCache.get(key); if (col) return col; col = new Float32Array(HOR * 3);
  const hgt = 14 + 96 * hsh(k * 1.37) ** 2, warm = hsh(k * 9.1) < .7;
  for (let y = 0; y < HOR; y++) {
    const tq = Math.floor(y / HOR * 9) / 9, m = tq ** 1.6, up = HOR - y; let r = 8 * (1 - m) + 86 * m, g = 10 * (1 - m) + 34 * m, b = 26 * (1 - m) + 96 * m;
    if (up < hgt) { r = 15; g = 16; b = 36; if (up % 5 < 2 && wc > 0 && hsh(k * 3.1 + Math.floor(up / 5) * 7.7 + wc * 13.3) < .2) { if (warm) { r = 210; g = 160; b = 96; } else { r = 70; g = 190; b = 200; } } }
    col[y * 3] = r; col[y * 3 + 1] = g; col[y * 3 + 2] = b;
  }
  skyCache.set(key, col); return col;
}

// ---------- render
const rowDist = new Float32Array(H); for (let y = HOR + 1; y < H; y++) rowDist[y] = EYE * S / (y + .5 - HOR);
let rainT = 0;
function render(cx, cy, ang, time) {
  const dx = Math.cos(ang), dy = Math.sin(ang), plx = -dy * P, ply = dx * P, A = atlas.data, AW = atlas.width, floorX = NT * TW;
  for (let x = 0; x < W; x++) {
    const cam = 2 * (x + .5) / W - 1, rx = dx + plx * cam, ry = dy + ply * cam;
    let mx = Math.floor(cx), my = Math.floor(cy); const ddx = Math.abs(1 / rx), ddy = Math.abs(1 / ry), sx = rx > 0 ? 1 : -1, sy = ry > 0 ? 1 : -1;
    let sdx = rx > 0 ? (mx + 1 - cx) * ddx : (cx - mx) * ddx, sdy = ry > 0 ? (my + 1 - cy) * ddy : (cy - my) * ddy, side = 0, guard = 0;
    while (guard++ < 64) { if (sdx < sdy) { sdx += ddx; mx += sx; side = 0; } else { sdy += ddy; my += sy; side = 1; } if (solid(mx, my)) break; }
    const d = Math.max(.02, side === 0 ? sdx - ddx : sdy - ddy); zb[x] = d;
    const hx = cx + rx * d, hy = cy + ry * d, f = side === 0 ? (sx > 0 ? "W" : "E") : (sy > 0 ? "N" : "S");
    let u = side === 0 ? hy - Math.floor(hy) : hx - Math.floor(hx); if (f === "E" || f === "N") u = 1 - u;
    let ti = faceTex(mx, my, f); if (tell && tell.k === mx + "," + my + "," + f) ti = TI["cipher"];
    const tx = ti * TW + Math.min(TW - 1, Math.floor(u * TW));
    const sky = skyCol(Math.atan2(ry, rx)), top = HOR - (WH - EYE) * S / d, bot = HOR + EYE * S / d, y0 = Math.max(0, Math.ceil(top - .5)), y1 = Math.min(H, Math.ceil(bot - .5));
    for (let y = 0; y < Math.min(y0, HOR); y++) { const o = (y * W + x) * 3; buf[o] = sky[y * 3]; buf[o + 1] = sky[y * 3 + 1]; buf[o + 2] = sky[y * 3 + 2]; }
    for (let y = Math.min(y0, HOR); y < y0; y++) { const o = (y * W + x) * 3; buf[o] = FOG[0]; buf[o + 1] = FOG[1]; buf[o + 2] = FOG[2]; }
    // light at the wall, sampled a little inside the open cell
    const nx = side === 0 ? -sx * .14 : 0, ny = side === 1 ? -sy * .14 : 0; light(hx + nx, hy + ny); const lr = lc[0], lg = lc[1], lb = lc[2];
    const fg = Math.exp(-FK * d), ef = .55 + .45 * Math.exp(-.08 * d), sh = side ? .82 : 1, span = bot - top;
    for (let y = y0; y < y1; y++) {
      const v = (y + .5 - top) / span, ty = Math.min(TH - 1, Math.floor(v * TH)), ai = (ty * AW + tx) * 4, em = A[((ty + TH) * AW + tx) * 4] > 128, o = (y * W + x) * 3;
      if (em) { buf[o] = A[ai] * ef + FOG[0] * (1 - ef); buf[o + 1] = A[ai + 1] * ef + FOG[1] * (1 - ef); buf[o + 2] = A[ai + 2] * ef + FOG[2] * (1 - ef); }
      else { const z = 1 - v, am = sh * (1 - .45 * z), lf = 1 - .3 * z; buf[o] = A[ai] * (AMB[0] * am + lr * lf) * fg + FOG[0] * (1 - fg); buf[o + 1] = A[ai + 1] * (AMB[1] * am + lg * lf) * fg + FOG[1] * (1 - fg); buf[o + 2] = A[ai + 2] * (AMB[2] * am + lb * lf) * fg + FOG[2] * (1 - fg); }
    }
    for (let y = Math.max(y1, HOR + 1); y < H; y++) {
      const rd = rowDist[y], wx = cx + rx * rd, wy = cy + ry * rd, fcx = Math.floor(wx), fcy = Math.floor(wy), fx = Math.floor((wx - fcx) * 64) & 63, fy = Math.floor((wy - fcy) * 64) & 63;
      const ai = (((manholes[fcx + "," + fcy] ? 64 : 0) + fy) * AW + floorX + fx) * 4, o = (y * W + x) * 3; light(wx, wy);
      let r = A[ai] * (AMB[0] + lc[0]), g = A[ai + 1] * (AMB[1] + lc[1]), b = A[ai + 2] * (AMB[2] + lc[2]);
      const n = vnoise(wx * 1.7 + 3.1, wy * 1.7 + 9.2) * .65 + vnoise(wx * 4.3, wy * 4.3) * .35;
      if (n > .56) { const ry2 = Math.max(0, 2 * HOR - y), ro = (ry2 * W + x) * 3; r = r * .25 + buf[ro] * .62 + lc[0] * 60; g = g * .25 + buf[ro + 1] * .62 + lc[1] * 60; b = b * .25 + buf[ro + 2] * .62 + lc[2] * 60; }
      else if (n > .53) { r *= .7; g *= .7; b *= .7; }
      const fg2 = Math.exp(-FK * rd); buf[o] = r * fg2 + FOG[0] * (1 - fg2); buf[o + 1] = g * fg2 + FOG[1] * (1 - fg2); buf[o + 2] = b * fg2 + FOG[2] * (1 - fg2);
    }
  }
  // sprites, far to near
  const inv = 1 / (plx * dy - dx * ply), list = [];
  for (const e of ents) { const s = spriteFor(e, time, cx, cy, plx, ply); if (s) list.push(s); }
  for (const p of props) list.push({ x: p.x, y: p.y, w: p.kind === "bags" ? .55 : .9, z: 0, r: DATA.rects[p.kind], em: false, flip: false });
  for (const s of list) { const ax = s.x - cx, ay = s.y - cy; s.tx = inv * (dy * ax - dx * ay); s.tz = inv * (-ply * ax + plx * ay); }
  list.sort((a, b) => b.tz - a.tz);
  const SD = sheet.data, SW = sheet.width;
  for (const s of list) {
    if (s.tz <= .18) continue; const [rx0, ry0, iw, ih] = s.r, sxc = W / 2 * (1 + s.tx / s.tz), wpx = s.w * S / s.tz, hpx = wpx * ih / iw, bot = HOR + (EYE - s.z) * S / s.tz, top = bot - hpx;
    light(s.x, s.y); const lr = Math.min(1.15, AMB[0] * 1.2 + lc[0]), lg = Math.min(1.15, AMB[1] * 1.2 + lc[1]), lb = Math.min(1.15, AMB[2] * 1.2 + lc[2]), fg = Math.exp(-FK * s.tz), ef = .8 + .2 * fg, al = s.a === undefined ? 1 : s.a;
    for (let xx = Math.max(0, Math.floor(sxc - wpx / 2)); xx < Math.min(W, Math.floor(sxc + wpx / 2) + 1); xx++) {
      if (s.tz >= zb[xx]) continue; let ui = Math.floor((xx + .5 - (sxc - wpx / 2)) / wpx * iw); if (ui < 0 || ui >= iw) continue; if (s.flip) ui = iw - 1 - ui;
      for (let yy = Math.max(0, Math.floor(top)); yy < Math.min(H, Math.floor(bot) + 1); yy++) {
        const vi = Math.floor((yy + .5 - top) / hpx * ih); if (vi < 0 || vi >= ih) continue; const si = ((ry0 + vi) * SW + rx0 + ui) * 4; if (SD[si + 3] < 128) continue; const o = (yy * W + xx) * 3;
        let r, g, b; if (s.em) { r = SD[si] * ef; g = SD[si + 1] * ef; b = SD[si + 2] * ef; } else { r = SD[si] * lr * fg + FOG[0] * (1 - fg); g = SD[si + 1] * lg * fg + FOG[1] * (1 - fg); b = SD[si + 2] * lb * fg + FOG[2] * (1 - fg); }
        buf[o] = buf[o] * (1 - al) + r * al; buf[o + 1] = buf[o + 1] * (1 - al) + g * al; buf[o + 2] = buf[o + 2] * (1 - al) + b * al;
      }
    }
  }
  // rain
  const rt = Math.floor(time * 30);
  for (let i = 0; i < 60; i++) {
    const x0 = Math.floor(hsh(i * 3.7) * W), sp = 150 + hsh(i * 9.1) * 90, y0 = ((hsh(i * 5.3) * (H + 30) + time * sp) % (H + 30)) - 20, n = 4 + Math.floor(hsh(i * 2.2) * 6);
    for (let k = 0; k < n; k++) { const yy = Math.floor(y0) + k, xx = x0 - (k >> 2); if (yy < 0 || yy >= H || xx < 0 || xx >= W) continue; const o = (yy * W + xx) * 3; buf[o] = buf[o] * .8 + 30; buf[o + 1] = buf[o + 1] * .8 + 34; buf[o + 2] = buf[o + 2] * .8 + 42; }
  }
  for (let i = 0, j = 0; i < W * H * 3; i += 3, j += 4) { px[j] = buf[i] > 255 ? 255 : buf[i] & 0xfc; px[j + 1] = buf[i + 1] > 255 ? 255 : buf[i + 1] & 0xfc; px[j + 2] = buf[i + 2] > 255 ? 255 : buf[i + 2] & 0xfc; px[j + 3] = 255; }
}
function spriteFor(e, t, cx, cy, plx, ply) {
  const R = DATA.rects;
  if (e.kind === "rat") { const mvx = e.vx || 0, mvy = e.vy || 0; return { x: e.x, y: e.y, w: .4, z: 0, r: R[Math.floor(t * 11 + e.sp * 3) % 2 ? "rat1" : "rat2"], em: false, flip: (mvx * plx + mvy * ply) < 0 }; }
  if (e.kind === "alert") { const p = .5 + .5 * Math.sin(t * 3.2 + e.ph); return { x: e.x, y: e.y, w: .3 + .05 * p, z: .5 + .02 * p, r: R.alert, em: true, a: .7 + .3 * p }; }
  if (e.kind === "analyze") return { x: e.x, y: e.y, w: .34, z: .46 + .05 * Math.sin(t * 1.6 + e.ph), r: R.analyze, em: true };
  if (e.kind === "adaptive") return { x: e.x, y: e.y, w: .34, z: .44 + .04 * Math.sin(t * 2.2 + e.ph), r: R.adaptive, em: true };
  if (e.kind === "aggressive") return { x: e.x, y: e.y, w: .4, z: .44 + .03 * Math.sin(t * 5 + e.ph), r: R.aggressive, em: true };
  if (e.kind === "bars") return { x: e.x, y: e.y, w: .98, z: 0, r: R.bars, em: true, a: e.a };
  if (e.kind === "fidget") { if (e.touch && t - e.touch > 1.2) { e.alive = false; return null; } return { x: e.x, y: e.y + 0, w: .26, z: .12 + Math.abs(Math.sin(t * 4 + e.ph)) * .12, r: R.fidget, em: true, flip: Math.sin(t * .9 + e.ph) > 0 }; }
  if (e.kind === "gizmo") { const k = e.drop === undefined ? 1 : Math.min(1, (t - e.drop) / .45); return { x: e.x, y: e.y, w: .2, z: .2 + .03 * Math.sin(t * 1.8 + e.ph) + (1 - k * k) * 1.6, r: R.gizmo, em: true, flip: false }; }
  if (e.kind === "grid") return { x: e.x, y: e.y, w: .44, z: .4 + .05 * Math.sin(t * 1.4), r: R.grid, em: true };
  return null;
}

// ---------- the walker and the residents
let flipT = 0, flipLimit = 12, cam, flipped = false, roll = 0, rollTo = 0, fade = 1, fadeTo = 0, pendingNew = false, bars = null;
function resetWalker() {
  const d = openNeighbors(start[0], start[1])[0], cx = start[0] + .5, cy = start[1] + .5;
  cam = { cx: start[0], cy: start[1], d: d, x: cx, y: cy, ang: d * Math.PI / 2, q: [{ type: "line", x0: cx, y0: cy, x1: cx + DX[d] * .5, y1: cy + DY[d] * .5, len: .5, t: 0 }], nd: d };
}
function blocked(x, y) { return solid(x, y) || sealed[x + "," + y]; }
// Plan the path through the cell just entered: straight, a quarter arc, or a walk in, a turn about, and a walk out.
function plan() {
  const order = flipped ? [3, 0, 1, 2] : [1, 0, 3, 2], d = cam.d, cx = cam.cx + .5, cy = cam.cy + .5, ex = cx - DX[d] * .5, ey = cy - DY[d] * .5, a = cam.ang;
  for (const k of order) {
    const nd = (d + k) % 4, nx = cam.cx + DX[nd], ny = cam.cy + DY[nd];
    if (sealed[nx + "," + ny] && !solid(nx, ny) && k !== 2 && !bars) bars = { kind: "bars", x: cx + DX[nd] * .5, y: cy + DY[nd] * .5, a: 0, life: 0 };
    if (blocked(nx, ny)) continue;
    cam.nd = nd;
    if (k === 0) cam.q = [{ type: "line", x0: ex, y0: ey, x1: cx + DX[d] * .5, y1: cy + DY[d] * .5, len: 1, t: 0 }];
    else if (k === 2) cam.q = [{ type: "line", x0: ex, y0: ey, x1: cx - DX[d] * .12, y1: cy - DY[d] * .12, len: .38, t: 0 }, { type: "spin", a0: a, a1: a + (flipped ? -Math.PI : Math.PI), len: .95, t: 0 }, { type: "line", x0: cx - DX[d] * .12, y0: cy - DY[d] * .12, x1: ex, y1: ey, len: .38, t: 0 }];
    else { const turn = k === 3 ? -1 : 1; cam.q = [{ type: "arc", ccx: ex + DX[nd] * .5, ccy: ey + DY[nd] * .5, ux: -DX[nd] * .5, uy: -DY[nd] * .5, vx: DX[d] * .5, vy: DY[d] * .5, a0: a, a1: a + turn * Math.PI / 2, len: .785, t: 0 }]; }
    return;
  }
  cam.q = [];
}
function stepWalker(dt) {
  let left = dt * 1.25, guard = 0;
  while (left > 1e-6 && cam.q.length && guard++ < 12) {
    const s = cam.q[0], k0 = s.t, k1 = Math.min(1, s.t + left / s.len); left -= (k1 - k0) * s.len; s.t = k1;
    if (s.type === "line") { cam.x = s.x0 + (s.x1 - s.x0) * k1; cam.y = s.y0 + (s.y1 - s.y0) * k1; }
    else if (s.type === "arc") { const th = k1 * Math.PI / 2; cam.x = s.ccx + s.ux * Math.cos(th) + s.vx * Math.sin(th); cam.y = s.ccy + s.uy * Math.cos(th) + s.vy * Math.sin(th); cam.ang = s.a0 + (s.a1 - s.a0) * k1; }
    else { const e = k1 * k1 * (3 - 2 * k1); cam.ang = s.a0 + (s.a1 - s.a0) * e; }
    if (k1 >= 1) {
      cam.q.shift();
      if (!cam.q.length) { cam.d = cam.nd; cam.ang = cam.d * Math.PI / 2; cam.cx += DX[cam.d]; cam.cy += DY[cam.d]; arrive(); plan(); }
    }
  }
}
function arrive() {
  for (const e of ents) if (e.kind === "fidget" && e.alive && !e.touch && !flipped && e.cx === cam.cx && e.cy === cam.cy) { e.touch = time; flipped = true; rollTo = Math.PI; flipT = 0; flipLimit = 10 + rnd() * 3.4; }
  // Gizmo sets you right side up. He does nothing if you already are.
  for (const e of ents) if (e.kind === "gizmo" && flipped && flipT >= 10 && e.cx === cam.cx && e.cy === cam.cy) { flipped = false; rollTo = 0; flipT = 0; }
  if (cam.cx === finish[0] && cam.cy === finish[1] && !pendingNew) { pendingNew = true; fadeTo = 1; }
}
function stepEnts(dt, t) {
  if (flipped) {
    flipT += dt;
    if (flipT >= flipLimit && !cam.sent) {
      const tx = cam.cx + DX[cam.nd], ty = cam.cy + DY[cam.nd]; let g = null, best = 1e9;
      for (const e of ents) if (e.kind === "gizmo") { const dd = (e.x - cam.x) ** 2 + (e.y - cam.y) ** 2; if (dd < best) { best = dd; g = e; } }
      if (g && !solid(tx, ty)) { g.cx = tx; g.cy = ty; g.x = tx + .5; g.y = ty + .5; g.drop = t; cam.sent = true; }
    }
  } else cam.sent = false;
  for (const e of ents) {
    if (e.kind === "rat" || e.kind === "adaptive") {
      const sp = e.kind === "rat" ? e.sp : .5;
      if (e.t >= 1) { const o = openNeighbors(e.cx, e.cy).filter(d => !sealed[(e.cx + DX[d]) + "," + (e.cy + DY[d])]); let pick; if (e.kind === "adaptive") { pick = o.includes(e.d) ? e.d : (o.includes((e.d + 2) % 4) ? (e.d + 2) % 4 : o[ri(o.length)]); } else { const fwd = o.filter(d => d !== (e.d + 2) % 4); pick = fwd.length ? fwd[ri(fwd.length)] : o[0]; } if (pick === undefined) continue; e.d = pick; e.t = 0; }
      e.t += dt * sp; const k = Math.min(1, e.t), lat = e.lat || 0, bx = e.cx + .5 + DX[e.d] * k, by = e.cy + .5 + DY[e.d] * k; e.vx = DX[e.d]; e.vy = DY[e.d]; e.x = bx + DY[e.d] * lat * .5; e.y = by - DX[e.d] * lat * .5;
      if (k >= 1) { e.cx += DX[e.d]; e.cy += DY[e.d]; }
    } else if (e.kind === "analyze") { // slides across its alley to stay in your line of sight
      const tx = Math.max(e.cx + .28, Math.min(e.cx + .72, cam.x)), ty = Math.max(e.cy + .28, Math.min(e.cy + .72, cam.y)); e.x += (tx - e.x) * Math.min(1, dt * 2); e.y += (ty - e.y) * Math.min(1, dt * 2);
    }
  }
  if (bars) { bars.life += dt; bars.a = bars.life < .25 ? bars.life / .25 : bars.life > 2.2 ? Math.max(0, 1 - (bars.life - 2.2) / .5) : 1; if (!ents.includes(bars)) ents.push(bars); if (bars.life > 2.7) { ents.splice(ents.indexOf(bars), 1); bars = null; } }
  // a small tell now and then: one wall ahead shows its cipher for a moment
  if (tell) { tell.life += dt; if (tell.life > .55) tell = null; }
  else if (t > nextTell) { nextTell = t + 9 + rnd() * 9; for (let s = 2; s < 6; s++) { const wx = cam.cx + DX[cam.d] * s, wy = cam.cy + DY[cam.d] * s; if (solid(wx, wy)) { tell = { k: wx + "," + wy + "," + FACE[cam.d], life: 0 }; break; } const sd = (cam.d + 1) % 4; if (solid(wx + DX[sd], wy + DY[sd]) && rnd() < .4) { tell = { k: (wx + DX[sd]) + "," + (wy + DY[sd]) + "," + FACE[sd], life: 0 }; break; } } }
}

// ---------- overlay map
const mapCv = opts.mapCanvas || null, mctx = mapCv ? mapCv.getContext("2d") : null, MS = 7; let mapOn = false;
function drawMap() {
  mapCv.width = MW * MS; mapCv.height = MH * MS; mapCv.style.width = MW * MS + "px"; mctx.clearRect(0, 0, mapCv.width, mapCv.height);
  mctx.fillStyle = "#16424a"; for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) if (!solid(x, y)) mctx.fillRect(x * MS, y * MS, MS, MS);
  const dot = (x, y, c, s) => { mctx.fillStyle = c; mctx.fillRect(Math.round(x * MS - s / 2), Math.round(y * MS - s / 2), s, s); };
  dot(start[0] + .5, start[1] + .5, "#39ff6a", 5); dot(finish[0] + .5, finish[1] + .5, "#ead6a0", 5);
  for (const e of ents) { if (e.kind === "rat") dot(e.x, e.y, "#cbd5e1", 2); else if (e.kind === "fidget" && e.alive) dot(e.x, e.y, "#e2622b", 4); else if (e.kind === "gizmo") dot(e.x, e.y, "#2ee6a0", 4); else if (e.kind === "alert" || e.kind === "analyze") dot(e.x, e.y, "#3ce0ff", 3); else if (e.kind === "adaptive") dot(e.x, e.y, "#ff3b4e", 3); else if (e.kind === "aggressive") dot(e.x, e.y, "#ffb02e", 4); }
  mctx.save(); mctx.translate(cam.x * MS, cam.y * MS); mctx.rotate(cam.ang); mctx.fillStyle = "#ffffff"; mctx.beginPath(); mctx.moveTo(4, 0); mctx.lineTo(-3, -3); mctx.lineTo(-3, 3); mctx.fill(); mctx.restore();
}

// ---------- loop
let last = 0, time = 0, paused = false, speed = 1, mazes = 0;
function draw() {
  render(cam.x, cam.y, cam.ang, time); octx.putImageData(frame, 0, 0);
  ctx.fillStyle = "#07090d"; ctx.fillRect(0, 0, W, H); ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(roll); const sc = 1 + .9 * Math.abs(Math.sin(roll)) ; ctx.scale(sc, sc); ctx.drawImage(off, -W / 2, -H / 2); ctx.restore();
  if (fade > 0) { ctx.fillStyle = "rgba(7,9,13," + fade + ")"; ctx.fillRect(0, 0, W, H); }
  if (mapOn) drawMap();
}
function tick(ts) {
  const dt = Math.min(.05, (ts - last) / 1000 || 0); last = ts;
  if (!paused) {
    for (let i = 0; i < speed; i++) { time += dt; stepWalker(dt); stepEnts(dt, time); }
    roll += (rollTo - roll) * Math.min(1, dt * 3.2); if (Math.abs(rollTo - roll) < .004) roll = rollTo;
    fade += Math.sign(fadeTo - fade) * Math.min(Math.abs(fadeTo - fade), dt * 1.6);
    if (pendingNew && fade >= 1) { newMaze(); resetWalker(); pendingNew = false; fadeTo = 0; mazes++; }
    draw();
  }
  if (!stopped) raf = requestAnimationFrame(tick);
}
let raf = 0, stopped = false;
function fresh() { newMaze(); resetWalker(); fade = 1; fadeTo = 0; pendingNew = false; bars = null; }
const ready = Promise.all([loadImg(DATA.atlas), loadImg(DATA.sheet)]).then(([a, s]) => {
  atlas = pixels(a); sheet = pixels(s); fresh();
  if (reduce) { // the still: stand at the head of the longest straight alley
    let best = 0; for (let y = 1; y < MH - 1; y++) for (let x = 1; x < MW - 1; x++) { if (solid(x, y)) continue; for (let d = 0; d < 4; d++) { if (!solid(x - DX[d], y - DY[d])) continue; let n = 0; while (!solid(x + DX[d] * (n + 1), y + DY[d] * (n + 1))) n++; if (n > best) { best = n; cam.cx = x; cam.cy = y; cam.d = d; cam.y = y + .5 - DY[d] * .1; cam.x = x + .5 - DX[d] * .15; cam.ang = d * Math.PI / 2; } } }
    plan(); fade = 0; paused = true; draw();
  }
  raf = requestAnimationFrame(tick); return api;
});
const api = {
  ready: ready,
  newMaze() { fresh(); if (paused) { fade = 0; draw(); } },
  setMap(on) { mapOn = !!on && !!mapCv; if (mapCv) mapCv.style.display = mapOn ? "block" : "none"; if (mapOn) drawMap(); },
  setPaused(p) { paused = !!p; },
  get paused() { return paused; },
  get reducedMotion() { return reduce; },
  stop() { stopped = true; cancelAnimationFrame(raf); },
  debug: { get flipT() { return flipT; }, get grid() { return grid; }, set speed(v) { speed = v; }, get mazes() { return mazes; }, get cam() { return cam; }, get flipped() { return flipped; }, get ents() { return ents; }, get finish() { return finish; } }
};
return api;
}
if (typeof window !== "undefined") window.BackAlleys = { create: createBackAlleys };
if (typeof module !== "undefined") module.exports = { create: createBackAlleys };
