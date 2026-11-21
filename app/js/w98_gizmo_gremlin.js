/* ===========================================================================
   ELYSIUM NIGHTS · GIZMO'S ANTICS, phase 3 (21 Nov 2026, the author's Gizmo animation handoff): the Gremlin episode.
   Gizmo is a Nixie, and misuse turns a Nixie core into a Gremlin. The episode is contained: it starts and ends in one sitting.

   THE FALL: about ten pokes or dismissals inside thirty seconds (pressing him, clicking his words away, sending him off) play
     Gizmo's Gremlin fall once. One fall a session. Blocked under Quiet, by reduced motion, and during any protected moment.
   DURING: the five Gremlin loops stand in for their ordinary counterparts (idle, working, notice, success, error); the success loop
     fires where Street Victory would. No spectacles, no sleep, no double click show.
   REDEMPTION: after three minutes, or sooner once three ordinary actions are done (a save, a roll), he is redeemed.
   INTERRUPTED: if the app closes while he is rusted one flag is kept (en_w98_gizmo_rust_v1). The next time he is up the redemption
     plays in place of the boot-up, once, and the flag is cleared.
   There is no Gremlin boot-up, closing or sleep. Saved per device, as his other settings are.

   Original work: the character and every animation are the author's own. No em or en dashes anywhere in this file (house style).
   =========================================================================== */
window.EN = window.EN || {};
(function () {
  if (!EN.w98 || !EN.w98.kit || !EN.w98.gizmo || !EN.w98.gizmo.act || !EN.w98.gizmo.act.hooks) return;
  var K = EN.w98.kit, GZ = EN.w98.gizmo, A = GZ.act, H = A.hooks, R = A.rank, store = K.store;
  var RUST = "en_w98_gizmo_rust_v1", FELL = "en_w98_gizmo_fell_v1";
  /* tunable (the handoff left these to be ruled on): pokes in the window, the window, the episode, actions for early redemption,
     the idle wait inside an episode, and the gap that stops one edit and its save counting twice */
  var T = { pokes: 10, window: 30000, episode: 180000, actions: 3, idle: 40000, actionGap: 400 };
  var S = { rusted: false, fellAt: 0, acts: 0, lastAct: 0, hits: [], fell: false, lastIdle: 0 };
  try { S.fell = sessionStorage.getItem(FELL) === "1"; } catch (e) {}

  /* ---- the counterparts: while he is rusted a scene is swapped for its Gremlin one */
  var SWAP = {
    "street-victory": "gremlin-success",
    "desync": "gremlin-error", "memory-leak": "gremlin-error", "ice-encounter": "gremlin-error", "black-ice": "gremlin-error",
    "plug-in": "gremlin-working", "data-check": "gremlin-working", "lockpick": "gremlin-working", "overheat": "gremlin-working",
    "back-alley-deal": "gremlin-notice"
  };
  H.subst = function (name) { return S.rusted && SWAP[name] ? SWAP[name] : name; };
  H.rusted = function () { return S.rusted; };

  /* ---- the fall: pokes and dismissals */
  function quietNow() { return A.effective() === "quiet"; }
  function rough() {
    var now = Date.now();
    S.hits.push(now);
    S.hits = S.hits.filter(function (t) { return now - t <= T.window; });
    if (S.rusted || S.fell || quietNow()) return false;
    if (S.hits.length < T.pokes) return false;
    if (A.protectedNow()) return false;
    return fall();
  }
  function fall() {
    if (!A.fire("gremlin-fall", { rank: R.crash })) return false;
    S.rusted = true; S.fell = true; S.fellAt = Date.now(); S.acts = 0; S.hits = []; S.lastIdle = Date.now();
    try { sessionStorage.setItem(FELL, "1"); } catch (e) {}
    store(RUST, "1");
    return true;
  }
  A.rough = rough;

  /* ---- the way out */
  function redeem() {
    if (!S.rusted) return false;
    S.rusted = false;
    store(RUST, "0");
    return A.fire("gremlin-redeemed", { rank: R.crash, wait: true });
  }
  function action(kind) {
    if (!S.rusted) return;
    var now = Date.now();
    if (now - S.lastAct < T.actionGap) return;
    S.lastAct = now;
    if (++S.acts >= T.actions) redeem();
  }
  H.action = action;
  try { if (EN.store && EN.store.onSave) EN.store.onSave(function (ok) { if (ok) action("save"); }); } catch (e) {}

  /* ---- a tick each second: the episode's clock, and his idle loop */
  H.tick = function (now) {
    if (!S.rusted) return;
    if (now - S.fellAt >= T.episode) { redeem(); return; }
    var idle = A.idleMs();
    if (idle >= T.idle && now - S.lastIdle >= T.idle && !A.now() && !A.pending()) { S.lastIdle = now; A.fire("gremlin-idle", { rank: R.spectacle }); }
  };

  /* ---- closed while rusted */
  H.interrupted = function () { return store(RUST) === "1" && !S.rusted; };
  H.cleared = function () { store(RUST, "0"); };

  A.gremlin = { tune: T, rusted: function () { return S.rusted; }, fell: function () { return S.fell; }, actions: function () { return S.acts; }, swap: SWAP, redeem: redeem, fall: fall,
    test: { reset: function () { S.rusted = false; S.fell = false; S.acts = 0; S.lastAct = 0; S.hits = []; S.fellAt = 0; S.lastIdle = 0; try { sessionStorage.removeItem(FELL); } catch (e) {} store(RUST, "0"); },
            age: function (ms) { S.hits = S.hits.map(function (t) { return t - ms; }); S.fellAt -= ms; S.lastIdle -= ms; }, state: function () { return JSON.parse(JSON.stringify(S)); }, hits: function () { return S.hits.length; }, forget: function () { S.hits = []; } } };
})();
