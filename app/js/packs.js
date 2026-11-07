/* =========================================================================
   #GRID OS · packs.js
   Content packs: content that is not in the public app. The app downloads a
   pack only for an account that holds its SKU (public.content_packs, readable
   under RLS only while public.has_entitlement(sku) is true), merges it into
   the EN.* data it came out of, and drops it again on a real jack out.
   First pack: the Freelancer's Companion, EN1101, held by any signed-in account.

   WHERE IT RUNS. Loaded after every data file and before the engine and the
   store, so the cached pack is merged before store.load() resolves a single
   saved character. Nothing here needs the cloud client at boot: the boot merge
   reads the stored session and the cache straight out of localStorage.

   THE CACHE. One localStorage entry per account and SKU,
     en_pack_v1:<user id>:<sku>  =  { version, format, payload, at }
   where payload is exactly what the database serves (format 1: ops as JSON
   text, see the packs repo's tools/build.js). A failed download keeps it.

   THE MERGE. Each op puts one entry back where the public app left a gap: an
   insert goes into its array at the index it has in the book, a set goes into
   its object after the key that preceded it. Inserts are applied in ascending
   index, so the pickers and the Codex list everything in the book's order.
   Every change is recorded, so a newer version, or a jack out, takes the old
   merge back out exactly. Merging the same version twice changes nothing.

   FORMATS. This app reads format 1. A pack in a format it cannot read is
   ignored (not cached, not merged) and asked for again next time.

   AFTER A CHANGE. Two indexes are built from pack data when the data files
   load (EN.statusChanges' Class Buffs, EN.hazards.mitigationByKey); they are
   rebuilt here. Then the store re-resolves the roster (EN.store.relock: a
   record that needs a pack this device has now loaded unlocks, one that needs
   a pack it no longer has locks), and the app and Settings redraw.

   THE MANIFEST. Which keys belong to which pack is public: EN.launch.companion
   (data/launch.js) for EN1101. missing(record) answers which packs a saved
   record needs that this device has not loaded; js/store.js locks it on that.
   ES5 throughout, like the rest of the app.
   ========================================================================= */
window.EN = window.EN || {};

EN.packs = (function () {
  "use strict";
  var FORMATS = [1];
  var SESSION_KEY = "sb-ggjgkcnhfpjwyrhakqun-auth-token";
  var CACHE_PREFIX = "en_pack_v1:";
  // the public manifest of each pack this app knows how to lock records for
  var MANIFEST = { EN1101: function () { return EN.launch && EN.launch.companion; } };

  var merged = {};     // sku -> { version, format, undo: [...] }
  var state = {};      // sku -> "loading" | "failed", while it is not merged
  var watchers = [];
  var booted = false, runId = 0;

  /* ---- the stored session (the vendored Supabase client's own entry) ------- */
  function storedSession() {
    try {
      var s = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
      if (s && s.currentSession) s = s.currentSession;   // an older client's shape
      return s && typeof s === "object" && s.user && s.user.id ? s : null;
    } catch (e) { return null; }
  }
  function storedUserId() { var s = storedSession(); return s ? String(s.user.id) : null; }

  /* ---- the cache ------------------------------------------------------------ */
  function cacheKey(uid, sku) { return CACHE_PREFIX + uid + ":" + sku; }
  function readCache(uid, sku) {
    try {
      var c = JSON.parse(localStorage.getItem(cacheKey(uid, sku)) || "null");
      return c && typeof c === "object" && c.payload && typeof c.version === "number" ? c : null;
    } catch (e) { return null; }
  }
  function writeCache(uid, sku, row, payload) {
    try {
      localStorage.setItem(cacheKey(uid, sku), JSON.stringify({ version: row.version, format: row.format, payload: payload, at: Date.now() }));
      return true;
    } catch (e) {
      // a full store: the pack still works for this visit, and downloads again next time
      console.warn("No room to keep the " + sku + " pack on this device; it will download again next time.", e);
      return false;
    }
  }
  function cachedSkus(uid) {
    var out = [], pre = CACHE_PREFIX + uid + ":";
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf(pre) === 0) out.push(k.slice(pre.length));
      }
    } catch (e) {}
    return out;
  }
  // every cached pack for this account (uid null: for every account on this device)
  function dropCaches(uid) {
    var pre = uid ? CACHE_PREFIX + uid + ":" : CACHE_PREFIX, gone = [];
    try {
      for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k && k.indexOf(pre) === 0) gone.push(k); }
      gone.forEach(function (k) { localStorage.removeItem(k); });
    } catch (e) {}
  }

  /* ---- ops ------------------------------------------------------------------ */
  function ident(v) {
    if (v == null) return null;
    if (typeof v !== "object") return String(v);
    return v.key != null ? String(v.key) : v.id != null ? String(v.id) : v.name != null ? String(v.name) : null;
  }
  function resolve(segs) {
    var o = EN;
    for (var i = 0; i < segs.length; i++) {
      var s = segs[i];
      if (o == null) return undefined;
      if (typeof s === "string") o = o[s];
      else if (Object.prototype.toString.call(o) === "[object Array]") {
        var hit = undefined;
        for (var j = 0; j < o.length; j++) if (ident(o[j]) === s.key) { hit = o[j]; break; }
        o = hit;
      } else return undefined;
    }
    return o;
  }
  // the ops of a payload this app can read, or null
  function readOps(payload) {
    if (!payload || typeof payload !== "object" || FORMATS.indexOf(payload.format) === -1) return null;
    if (typeof payload.ops !== "string") return null;
    try {
      var ops = JSON.parse(payload.ops);
      return Object.prototype.toString.call(ops) === "[object Array]" ? ops : null;
    } catch (e) { return null; }
  }
  function clone(v) { return v == null || typeof v !== "object" ? v : JSON.parse(JSON.stringify(v)); }
  // put a key back into an object after the key that preceded it, keeping the book's order
  function setAfter(o, key, after, val) {
    var keys = Object.keys(o), at = after == null ? 0 : keys.indexOf(after) + 1;
    if (after != null && at === 0) { o[key] = val; return; }   // its neighbour is gone: append
    var tail = keys.slice(at).map(function (k) { return [k, o[k]]; });
    tail.forEach(function (kv) { delete o[kv[0]]; });
    o[key] = val;
    tail.forEach(function (kv) { o[kv[0]] = kv[1]; });
  }

  /* Merge one pack. A merge of another version is taken out first. Answers whether it is merged. */
  function apply(sku, payload, version) {
    var ops = readOps(payload);
    if (!ops) return false;
    if (merged[sku] && merged[sku].version === version) return true;
    if (merged[sku]) unmerge(sku);
    var inserts = ops.filter(function (o) { return o && o.op === "insert"; }).sort(function (a, b) { return a.index - b.index; });
    var sets = ops.filter(function (o) { return o && o.op === "set"; });
    var undo = [], missed = 0;
    inserts.concat(sets).forEach(function (op) {
      var tgt = resolve(op.at || []);
      if (tgt == null || typeof tgt !== "object") { missed++; return; }
      var val = clone(op.value);
      if (op.op === "insert") {
        if (Object.prototype.toString.call(tgt) !== "[object Array]") { missed++; return; }
        var id = ident(op.value), have = -1;
        if (id != null) for (var i = 0; i < tgt.length; i++) if (ident(tgt[i]) === id) { have = i; break; }
        if (have !== -1) { undo.push({ arr: tgt, val: val, prev: tgt[have], had: true }); tgt[have] = val; }
        else { tgt.splice(Math.min(op.index, tgt.length), 0, val); undo.push({ arr: tgt, val: val, had: false }); }
      } else {
        var had = Object.prototype.hasOwnProperty.call(tgt, op.key);
        undo.push({ obj: tgt, key: op.key, had: had, prev: had ? tgt[op.key] : undefined });
        if (had) tgt[op.key] = val; else setAfter(tgt, op.key, op.after, val);
      }
    });
    if (missed) console.warn("Pack " + sku + ": " + missed + " entries found nowhere to go in this version of the app.");
    merged[sku] = { version: version, format: payload.format, undo: undo };
    delete state[sku];
    return true;
  }
  function unmerge(sku) {
    var m = merged[sku];
    if (!m) return;
    for (var i = m.undo.length - 1; i >= 0; i--) {
      var u = m.undo[i];
      if (u.arr) {
        var at = u.arr.indexOf(u.val);
        if (at === -1) continue;
        if (u.had) u.arr[at] = u.prev; else u.arr.splice(at, 1);
      } else if (u.had) u.obj[u.key] = u.prev;
      else delete u.obj[u.key];
    }
    delete merged[sku];
  }

  /* ---- what a merge changes downstream ----------------------------------------- */
  function rebuildDerived() {
    var H = EN.hazards;
    if (H && H.mitigations) {
      var by = H.mitigationByKey || (H.mitigationByKey = {});
      Object.keys(by).forEach(function (k) { delete by[k]; });
      H.mitigations.forEach(function (m) { if (m && m.key) by[m.key] = m; });
    }
    if (EN.statusChanges && EN.statusChanges.rebuild) EN.statusChanges.rebuild();
  }
  function changed() {
    rebuildDerived();
    if (!booted) return;
    if (EN.store && EN.store.relock) { try { EN.store.relock(); } catch (e) { console.error("Re-resolving the roster failed", e); } }
    notify();
  }
  // redraw what shows pack state (Settings' // CONTENT reads status() as it goes)
  function notify() {
    if (!booted) return;
    if (EN.app && EN.app.render) { try { EN.app.render(); } catch (e) { console.error(e); } }
    if (EN.settings && EN.settings.refresh) { try { EN.settings.refresh(); } catch (e) { console.error(e); } }
    watchers.forEach(function (f) { try { f(); } catch (e) { console.error(e); } });
  }

  /* ---- boot: the cached packs of the account in the stored session ---------- */
  function boot() {
    var uid = storedUserId();
    if (uid) cachedSkus(uid).forEach(function (sku) {
      var c = readCache(uid, sku);
      if (c && !apply(sku, c.payload, c.version)) console.warn("The cached " + sku + " pack is in a format this app cannot read; it will download again.");
    });
    rebuildDerived();
  }

  /* ---- after sign-in: what the account holds, and whatever is newer ---------- */
  function rows(res) { if (res && res.error) throw res.error; return res ? res.data : null; }
  function refresh(client, uid) {
    if (!client || !uid) return Promise.resolve();
    var me = ++runId, any = false;
    function current() { return me === runId; }
    return Promise.resolve(client.rpc("my_entitlements")).then(rows).then(function (list) {
      if (!current()) return;
      var held = (list || []).map(function (x) { return typeof x === "string" ? x : x && (x.my_entitlements || x.sku); }).filter(Boolean);
      // packs this account does not hold (any more): out of memory and off the device
      Object.keys(merged).concat(cachedSkus(uid)).forEach(function (sku) {
        if (held.indexOf(sku) !== -1) return;
        try { localStorage.removeItem(cacheKey(uid, sku)); } catch (e) {}
        if (merged[sku]) { unmerge(sku); any = true; }
      });
      held.forEach(function (sku) { if (!merged[sku]) state[sku] = "loading"; });
      if (held.length) notify();
      return held.reduce(function (p, sku) { return p.then(function () { if (current()) return one(client, uid, sku); }); }, Promise.resolve());
    }).catch(function (e) {
      console.warn("Could not read this account's packs", e);
      Object.keys(state).forEach(function (sku) { if (state[sku] === "loading") state[sku] = "failed"; });
    }).then(function () {
      if (!current()) return;
      if (any) changed(); else notify();
    });

    function one(client, uid, sku) {
      return Promise.resolve(client.from("content_packs").select("sku, version, format").eq("sku", sku).maybeSingle())
        .then(rows).then(function (row) {
          if (!current()) return;
          if (!row) { delete state[sku]; return; }                       // nothing published yet
          if (FORMATS.indexOf(row.format) === -1) {                       // a format this app cannot read
            console.warn("Pack " + sku + " is format " + row.format + "; this app reads " + FORMATS.join(", ") + ".");
            if (!merged[sku]) state[sku] = "failed";
            return;
          }
          var c = readCache(uid, sku);
          if (merged[sku] && merged[sku].version === row.version && c && c.version === row.version) return;
          if (c && c.version === row.version && readOps(c.payload)) {    // cached already, not merged yet
            apply(sku, c.payload, c.version); any = true; return;
          }
          return Promise.resolve(client.from("content_packs").select("version, format, payload").eq("sku", sku).maybeSingle())
            .then(rows).then(function (full) {
              if (!current()) return;
              if (!full || !readOps(full.payload)) {                       // unreadable: ignore it, ask again next time
                console.warn("Pack " + sku + " could not be read; it will download again.");
                if (!merged[sku]) state[sku] = "failed";
                return;
              }
              writeCache(uid, sku, full, full.payload);
              if (apply(sku, full.payload, full.version)) any = true;
            });
        })
        .catch(function (e) {
          // a failed download keeps whatever is cached and merged
          console.warn("Pack " + sku + " download failed", e);
          if (!merged[sku]) state[sku] = "failed";
        });
    }
  }

  /* ---- a real jack out: the account's packs leave this device ---------------- */
  function drop(uid) {
    runId++;
    dropCaches(uid || null);
    var had = Object.keys(merged).length > 0;
    Object.keys(merged).forEach(unmerge);
    state = {};
    if (had) changed(); else notify();
  }

  /* ---- the manifest: does a saved record need a pack this device has not loaded? ---- */
  var keySets = {};
  function keySet(sku) {
    if (keySets[sku]) return keySets[sku];
    var m = MANIFEST[sku] && MANIFEST[sku]();
    if (!m) return null;
    var exact = Object.create(null), talentNames = Object.create(null);
    ["lineage", "subclass", "talent", "background", "tool", "item", "bonus"].forEach(function (kind) {
      (m[kind] || []).forEach(function (k) { exact[k] = true; });
    });
    // a Talent may still sit on an old save by its display name, in a talent field
    (m.talent || []).forEach(function (k) { if (m.names && m.names[k]) talentNames[m.names[k]] = true; });
    return (keySets[sku] = { exact: exact, talentNames: talentNames });
  }
  // the manifest keys a record refers to: every string value, and every key of every object
  function refs(rec, ks, out) {
    var seen = [];
    (function walk(v, field) {
      if (typeof v === "string") {
        if (ks.exact[v] || (/talent/i.test(field || "") && ks.talentNames[v])) out[v] = true;
        return;
      }
      if (!v || typeof v !== "object" || seen.indexOf(v) !== -1) return;
      seen.push(v);
      if (Object.prototype.toString.call(v) === "[object Array]") { for (var i = 0; i < v.length; i++) walk(v[i], field); return; }
      for (var k in v) if (Object.prototype.hasOwnProperty.call(v, k)) {
        if (ks.exact[k]) out[k] = true;
        walk(v[k], k);
      }
    })(rec, "");
    return out;
  }
  // the SKUs this record needs that are not loaded here
  function missing(rec) {
    var out = [];
    Object.keys(MANIFEST).forEach(function (sku) {
      if (merged[sku]) return;
      var ks = keySet(sku);
      if (ks && Object.keys(refs(rec, ks, {})).length) out.push(sku);
    });
    return out;
  }
  // the manifest keys a record refers to, with display names, for the locked chips
  function picks(rec, sku) {
    var ks = keySet(sku), m = MANIFEST[sku] && MANIFEST[sku]();
    if (!ks) return [];
    return Object.keys(refs(rec, ks, {})).map(function (k) { return { key: k, name: (m.names && m.names[k]) || k }; });
  }

  function loaded(sku) { return !!merged[sku]; }
  function version(sku) { return merged[sku] ? merged[sku].version : null; }
  // "loaded", "loading", "failed" or "none"
  function status(sku) { return merged[sku] ? "loaded" : state[sku] || "none"; }

  boot();

  return {
    loaded: loaded, version: version, status: status,
    missing: missing, picks: picks,
    refresh: refresh, drop: drop,
    storedSession: storedSession, storedUserId: storedUserId,
    onChange: function (fn) { watchers.push(fn); },
    // app.js calls this once the app is drawn: from then on a change redraws it
    ready: function () { booted = true; },
    formats: FORMATS.slice(),
    // for the test suite: merge or take out a payload without the network
    _apply: function (sku, payload, v) { var ok = apply(sku, payload, v); if (ok) changed(); return ok; },
    _unmerge: function (sku) { unmerge(sku); changed(); }
  };
})();
