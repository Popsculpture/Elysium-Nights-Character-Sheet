/* Vending Fleet: screen saver for #GRIDOS '98.
   Use: const saver = VendingFleet.create(canvas, data, { density, reducedMotion });
        saver.ready.then(...); saver.setDensity(0 to 1); saver.stop() when the screen saver closes.
   data is the parsed vending-fleet-data.json. The canvas is drawn at 836 x 472; size it with CSS. */
function createVendingFleet(cv, DATA, opts) {
"use strict";
opts = opts || {};
const W = DATA.w, H = DATA.h;
cv.width = W; cv.height = H;
const ctx = cv.getContext("2d"); ctx.imageSmoothingEnabled = false;
const reduce = opts.reducedMotion !== undefined ? !!opts.reducedMotion : !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
let density = opts.density !== undefined ? Math.max(0, Math.min(1, opts.density)) : .5;

// ---------- small helpers
let seed = (opts.seed || Date.now()) >>> 0;
function rnd() { seed ^= seed << 13; seed >>>= 0; seed ^= seed >>> 17; seed ^= seed << 5; seed >>>= 0; return seed / 4294967296; }
function loadImg(src) { return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; }); }
const R = DATA.rects, COLORS = ["pink", "cyan", "amber"];
let img = {}, mask = null;

// ---------- the fleet
// Every machine flies the same heading, two across for one down. Lanes sit side by side across that heading,
// far apart enough that two lanes can never touch. Big and small machines take alternate lanes, so the two
// sizes never cross either. Inside a lane everyone holds the same speed, so the gap set at launch never closes.
const FX = 2 / Math.sqrt(5), FY = 1 / Math.sqrt(5), NX = -FY, NY = FX, HALF = 600;
const LANE_GAP = 106, LANES = [];
for (let k = 0; k < 8; k++) LANES.push({ o: -371 + k * LANE_GAP, big: k % 2 === 1, speed: k % 2 === 1 ? 74 : 46, list: [], next: 0 });
function gapFor(lane) { // distance between machines in one lane, from the density setting
  const min = lane.big ? 210 : 140, sparse = lane.big ? 1500 : 1100, dense = lane.big ? 250 : 170;
  const base = sparse + (dense - sparse) * Math.pow(density, .7);
  return Math.max(min, base * (.8 + rnd() * .7));
}
function launch(lane, s) {
  const m = { s: s, color: COLORS[Math.floor(rnd() * 3)], can: Math.floor(rnd() * 6), bob: rnd() * 6.28, bobSpeed: 2.6 + rnd() * 1.2, vend: 1.5 + rnd() * 5, flap: 0, cans: [] };
  lane.list.push(m); lane.next = gapFor(lane); return m;
}
function fillLanes() {
  for (const lane of LANES) { lane.list = []; let s = HALF - rnd() * gapFor(lane); while (s > -HALF) { launch(lane, s); s -= lane.next; } lane.list.reverse(); lane.list.sort((a, b) => a.s - b.s); }
}
function lanePos(lane, s) { return [W / 2 + NX * lane.o + FX * s, H / 2 + NY * lane.o + FY * s]; }
const loose = []; // cans that have lit their rocket and left the machine
function stepFleet(dt) {
  for (const lane of LANES) {
    for (const m of lane.list) {
      m.s += lane.speed * dt; m.bob += m.bobSpeed * dt; m.vend -= dt; if (m.flap > 0) m.flap -= dt;
      if (m.vend <= 0 && m.s > -HALF + 60 && m.s < HALF - 160) { m.vend = 3.2 + rnd() * 5.5; m.flap = .7; m.cans.push({ t: 0, ci: m.can }); m.can = Math.floor(rnd() * 6); }
      for (let i = m.cans.length - 1; i >= 0; i--) {
        const c = m.cans[i]; c.t += dt;
        if (c.t >= .9) { // rolled out, hung for half a second, now it goes
          const p = machineXY(lane, m), sl = DATA.slots[lane.big ? "14" : "8"], k = lane.big ? 1 : .6;
          loose.push({ x: p[0] + sl[0] + 13 * k, y: p[1] + sl[1] + 13 * k, v: lane.speed, a: 900, ci: c.ci, big: lane.big, lane: lane }); m.cans.splice(i, 1);
        }
      }
    }
    while (lane.list.length && lane.list[lane.list.length - 1].s > HALF) lane.list.pop();
    const last = lane.list[0];
    if (!last || last.s > -HALF + lane.next) { const m = launch(lane, -HALF); lane.list.pop(); lane.list.unshift(m); }
  }
  for (let i = loose.length - 1; i >= 0; i--) { const c = loose[i]; c.v += c.a * dt; c.x += FX * c.v * dt; c.y += FY * c.v * dt; if (c.x > W + 40 || c.y > H + 40) loose.splice(i, 1); }
}
function machineXY(lane, m) { // top left of the sprite, with the bob
  const p = lanePos(lane, m.s), r = R[(lane.big ? "m14-" : "m8-") + m.color + "-00"];
  return [Math.round(p[0] - r[2] / 2), Math.round(p[1] - r[3] / 2 + Math.sin(m.bob) * (lane.big ? 3 : 2))];
}
function spr(key, x, y) { const r = R[key]; ctx.drawImage(img.sheet, r[0], r[1], r[2], r[3], x, y, r[2], r[3]); }
function drawFleet(big, time) {
  const jet = Math.floor(time / .08) % 2, list = [];
  for (const lane of LANES) if (lane.big === big) for (const m of lane.list) list.push([lane, m]);
  list.sort((a, b) => lanePos(a[0], a[1].s)[1] - lanePos(b[0], b[1].s)[1]);
  const u = big ? "14" : "8", sm = big ? "0" : "1", sl = DATA.slots[u], k = big ? 1 : .6;
  for (const [lane, m] of list) {
    const p = machineXY(lane, m); spr("m" + u + "-" + m.color + "-" + (m.flap > 0 ? "1" : "0") + jet, p[0], p[1]);
    for (const c of m.cans) {
      let dx, dy; if (c.t < .4) { const e = 1 - Math.pow(1 - c.t / .4, 2); dx = 10 * e; dy = 9 * e; } else { const e = (c.t - .4) / .5; dx = 10 + 3 * e; dy = 9 + 4 * e; }
      const f = c.t < .4 ? Math.floor(c.t / .1) % 3 : Math.floor(c.t / .22) % 3, r = R["c" + sm + "-" + c.ci + "-" + f];
      spr("c" + sm + "-" + c.ci + "-" + f, Math.round(p[0] + sl[0] + dx * k - r[2] / 2), Math.round(p[1] + sl[1] + dy * k - r[3] / 2));
    }
  }
  for (const c of loose) if (c.big === big) spr("r" + sm + "-" + c.ci, Math.round(c.x - 21), Math.round(c.y - 13));
}

// ---------- the city below
// Traffic: head and tail lights on every avenue, both ways, only where the road shows between buildings.
const cars = [];
function P(i, j) { return [DATA.ox + (i - j) * 8, DATA.oy + (i + j) * 4]; }
function seedTraffic() {
  for (const [axis, idx, a, b, trunk] of DATA.roads) {
    const n = Math.round((b - a) / (trunk ? 2.2 : 6));
    for (let k = 0; k < n; k++) { const dir = rnd() < .5 ? 1 : -1; cars.push({ axis: axis, idx: idx + (dir > 0 ? .34 : .66), a: a, b: b, t: a + rnd() * (b - a), v: dir * (trunk ? 1.5 + rnd() * 1.2 : .7 + rnd() * .8), hot: rnd() < .12 }); }
  }
}
function drawTraffic(dt) {
  for (const c of cars) {
    c.t += c.v * dt; if (c.t > c.b) c.t -= (c.b - c.a); if (c.t < c.a) c.t += (c.b - c.a);
    const p = c.axis === "i" ? P(c.t, c.idx) : P(c.idx, c.t), x = Math.round(p[0]), y = Math.round(p[1]);
    if (x < 1 || y < 1 || x >= W - 1 || y >= H - 1 || !mask[y * W + x]) continue;
    const sx = (c.axis === "i" ? 1 : -1) * Math.sign(c.v);
    ctx.fillStyle = c.hot ? "#b8f3ff" : "#fff4d6"; ctx.fillRect(x, y, 1, 1);
    if (mask[y * W + x - sx * 2]) { ctx.fillStyle = "#ff3b4e"; ctx.fillRect(x - sx * 2, y - Math.sign(c.v) * 1, 1, 1); }
  }
}
// Twinkle: a few hundred window and street lights that dim out or flare, each on its own clock.
const tw = [];
// Nothing twinkles on the processor or its pad field: the mark stays clean.
const TWINKLE = DATA.twinkle.filter(p => Math.abs(p[0] - DATA.hero[0]) / 2 + Math.abs(p[1] - DATA.hero[1] - 4) > 62);
function seedTwinkle() { for (let k = 0; k < 420; k++) tw.push(newTwinkle(true)); }
function newTwinkle(first) { const p = TWINKLE[Math.floor(rnd() * TWINKLE.length)], life = .4 + rnd() * 2.6; return { p: p, life: life, t: first ? rnd() * life : 0, flare: rnd() < .45 }; }
function drawTwinkle(dt) {
  for (let k = 0; k < tw.length; k++) {
    const t = tw[k]; t.t += dt; if (t.t > t.life) { tw[k] = newTwinkle(false); continue; }
    const e = Math.sin(Math.PI * t.t / t.life);
    if (t.flare) { ctx.fillStyle = "rgba(255,255,255," + (.85 * e).toFixed(2) + ")"; ctx.fillRect(t.p[0], t.p[1], 1, 1); ctx.fillStyle = "rgba(" + t.p[2] + "," + t.p[3] + "," + t.p[4] + "," + (.35 * e).toFixed(2) + ")"; ctx.fillRect(t.p[0] - 1, t.p[1], 3, 1); ctx.fillRect(t.p[0], t.p[1] - 1, 1, 3); }
    else { ctx.fillStyle = "rgba(10,12,20," + (.9 * e).toFixed(2) + ")"; ctx.fillRect(t.p[0], t.p[1], 1, 1); }
  }
}
// The processor: a slow warm double beat, like something under load.
function drawHeart(time) {
  const ph = (time % 3.2) / 3.2, beat = Math.max(Math.exp(-Math.pow((ph - .12) / .07, 2)), .7 * Math.exp(-Math.pow((ph - .3) / .09, 2))), lvl = .12 + .3 * beat;
  const hx = DATA.hero[0], hy = DATA.hero[1]; ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.translate(hx, hy); ctx.scale(1, .5);
  const g = ctx.createRadialGradient(0, 0, 4, 0, 0, 120 + 26 * beat);
  g.addColorStop(0, "rgba(255,170,110," + (.85 * lvl).toFixed(3) + ")"); g.addColorStop(.3, "rgba(255,96,140," + (.5 * lvl).toFixed(3) + ")"); g.addColorStop(1, "rgba(255,96,140,0)");
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 150, 0, 6.3); ctx.fill(); ctx.restore();
}
function drawLights(time) {
  ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.imageSmoothingEnabled = true;
  ctx.globalAlpha = .1 + .26 * (.5 + .5 * Math.sin(time * .9)); ctx.drawImage(img.lightsA, 0, 0, W, H);
  ctx.globalAlpha = .1 + .26 * (.5 + .5 * Math.sin(time * .7 + 2.1)); ctx.drawImage(img.lightsB, 0, 0, W, H);
  ctx.restore(); ctx.imageSmoothingEnabled = false;
}
// Clouds: two decks that slide against the heading at different speeds. The low deck is slow and heavy, the high one fast and thin.
function drawClouds(im, speed, time) {
  const tw_ = im.width, th = im.height, d = (time * speed) % tw_, ox = -Math.round(d), oy = -Math.round(d / 2);
  for (let x = ox; x < W; x += tw_) for (let y = oy; y < H; y += th) ctx.drawImage(im, x, y);
}

// ---------- loop
let time = 0, last = 0, raf = 0, stopped = false, paused = false, speed = 1;
function draw(dt) {
  ctx.drawImage(img.city, 0, 0); drawLights(time); drawTwinkle(dt); drawTraffic(dt); drawHeart(time);
  drawClouds(img.cloudsLow, 7, time); drawFleet(false, time); drawClouds(img.cloudsHigh, 17, time); drawFleet(true, time);
}
function tick(ts) {
  const dt = Math.min(.05, (ts - last) / 1000 || 0); last = ts;
  if (!paused) { for (let i = 0; i < speed; i++) { time += dt; stepFleet(dt); } draw(dt * speed); }
  if (!stopped) raf = requestAnimationFrame(tick);
}
const ready = Promise.all(["city", "lightsA", "lightsB", "cloudsLow", "cloudsHigh", "roadmask", "sheet"].map(k => loadImg(DATA[k]).then(i => { img[k] = i; }))).then(() => {
  const c = document.createElement("canvas"); c.width = W; c.height = H; const x = c.getContext("2d"); x.drawImage(img.roadmask, 0, 0); const d = x.getImageData(0, 0, W, H).data; mask = new Uint8Array(W * H); for (let i = 0; i < W * H; i++) mask[i] = d[i * 4] > 127 ? 1 : 0;
  seedTraffic(); seedTwinkle(); fillLanes();
  if (reduce) { paused = true; draw(0); }
  raf = requestAnimationFrame(tick); return api;
});
const api = {
  ready: ready,
  setDensity(v) { density = Math.max(0, Math.min(1, v)); for (const lane of LANES) lane.next = Math.min(lane.next, gapFor(lane)); },
  get density() { return density; },
  refill() { fillLanes(); loose.length = 0; if (paused) draw(0); },
  setPaused(p) { paused = !!p; },
  get paused() { return paused; },
  get reducedMotion() { return reduce; },
  stop() { stopped = true; cancelAnimationFrame(raf); },
  debug: { get lanes() { return LANES; }, get loose() { return loose; }, set speed(v) { speed = v; }, machineXY: machineXY, rects: R }
};
return api;
}
if (typeof window !== "undefined") window.VendingFleet = { create: createVendingFleet };
if (typeof module !== "undefined") module.exports = { create: createVendingFleet };
