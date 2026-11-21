/* ===========================================================================
   ELYSIUM NIGHTS · GIZMO'S ANTICS, phase 2b (21 Nov 2026, the author's Gizmo animation handoff): the app and system events.
   The app reports what happened through EN.w98.moment(kind, data) (a no-op on every other skin); this file is the table that turns
   each one into a scene, and the few listeners that need no edit to the app (a failed save, a deleted record, an uncaught error,
   the browser going offline). Phase 2a wired the dice and game moments in js/w98_gizmo_act.js; this is the rest.

     the cloud link starts to sync ........ Plug In            (a sync past two seconds also gets Overheat)
     the link drops, or a save is refused .. Desync / Memory Leak
     the link comes back after a fault ..... Percussive Maintenance
     a fresh sign-in ........................ Lockpick
     Find opens ............................. Data Check
     a tip is offered ....................... Back Alley Deal
     a file is imported or exported ......... Dead Drop
     a record is deleted .................... Evidence Disposal
     a refusal (SYNC needs the link, the server says no) ... Ice Encounter
     an uncaught error (once a session) ..... Black Ice
   Repeats are spaced by a per-scene cooldown so a busy session does not turn into a floor show. A scene that was asked for under
   a dialog waits for it (js/w98_gizmo_act.js), the ones that are only about the moment they happen in are dropped.
   Not wired, and why: No Cameras has no signal to read (a browser cannot see a screen capture), so it plays only as a spectacle.

   Original work. No em or en dashes anywhere in this file (house style).
   =========================================================================== */
window.EN = window.EN || {};
(function () {
  if (!EN.w98 || !EN.w98.gizmo || !EN.w98.gizmo.act || !EN.w98.gizmo.act.moments) return;
  var A = EN.w98.gizmo.act, R = A.rank, M = A.moments, T0 = Date.now();
  /* milliseconds a scene is not repeated for (tunable) */
  var COOL = { "plug-in": 120000, "data-check": 20000, "lockpick": 300000, "dead-drop": 6000, "evidence-disposal": 15000, "percussive-maintenance": 30000,
    "desync": 60000, "memory-leak": 60000, "ice-encounter": 20000, "overheat": 120000, "back-alley-deal": 0 };
  var last = {}, crashed = false, JOB_MS = 2000;
  /* returning from the Discord sign-in: the address carries the answer when the page loads */
  var RETURNING = false;
  try { RETURNING = /[?&#](access_token|code|error_description)=/.test(String(location.href)); } catch (e) {}

  function go(name, rank, o) {
    var now = Date.now(), c = COOL[name] || 0;
    if (c && now - (last[name] || 0) < c) return false;
    o = o || {}; o.rank = rank; o.wait = !!o.wait; o.keep = !!o.keep;
    if (!A.fire(name, o)) return false;
    last[name] = now;
    return true;
  }

  /* a job past two seconds: PDF export, a slow sync. job() hands back the function that says it is over. */
  function job() {
    var t = setTimeout(function () { go("overheat", R.tip); }, JOB_MS);
    return function () { clearTimeout(t); };
  }
  EN.w98.job = job;
  var syncEnd = null;

  /* ---- the cloud link: EN.cloud reports each change of its status */
  M.link = function (d) {
    var from = d.from, to = d.to;
    if (to === "syncing" && from !== "syncing") {
      go("plug-in", R.tip);
      if (syncEnd) syncEnd();
      syncEnd = job();
      return true;
    }
    if (from === "syncing" && syncEnd) { syncEnd(); syncEnd = null; }
    if (to === "error" && from !== "error") {
      // a write that failed with the network up is a failed save; with it down, the link is simply gone
      return (typeof navigator !== "undefined" && navigator.onLine === false) ? go("desync", R.error) : go("memory-leak", R.error);
    }
    if (from === "error" && to === "ok") return go("percussive-maintenance", R.success);
    return false;
  };
  window.addEventListener("offline", function () { go("desync", R.error); });

  /* ---- a fresh sign-in; not a session the app restored at launch */
  var firstSignIn = true;
  M.signin = function () {
    var fresh = (RETURNING && firstSignIn) || Date.now() - T0 > 10000;
    firstSignIn = false;
    return fresh ? go("lockpick", R.tip) : false;
  };

  M.find = function () { return go("data-check", R.tip); };
  M.tip = function () { return go("back-alley-deal", R.tip, { wait: true, keep: true }); };
  M.file = function () { return go("dead-drop", R.success); };
  M["delete"] = function () { return go("evidence-disposal", R.success); };
  M.refused = function () { return go("ice-encounter", R.error); };
  M["save-fail"] = function () { return go("memory-leak", R.error); };
  M.crash = function () {
    if (crashed) return false;
    var ok = A.fire("black-ice", { rank: R.crash });
    if (ok) crashed = true;
    return ok;
  };

  /* ---- listeners that need no edit to the app */
  try { if (EN.store && EN.store.onSave) EN.store.onSave(function (ok) { if (!ok) EN.w98.moment("save-fail"); }); } catch (e) {}
  try { if (EN.store && EN.store.onRemove) EN.store.onRemove(function () { EN.w98.moment("delete"); }); } catch (e) {}
  function noise(msg) { return /ResizeObserver loop|^Script error\.?$|Non-Error promise rejection/.test(String(msg || "")); }
  window.addEventListener("error", function (e) { if (!noise(e && e.message)) EN.w98.moment("crash"); });
  window.addEventListener("unhandledrejection", function (e) {
    var r = e && e.reason; if (!noise(r && r.message ? r.message : r)) EN.w98.moment("crash");
  });
  A.events = { cool: COOL, job: job, jobMs: JOB_MS, reset: function () { last = {}; crashed = false; firstSignIn = true; },
    test: { setStart: function (t) { T0 = t; }, setReturning: function (v) { RETURNING = !!v; } } };
})();
