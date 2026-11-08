/* =========================================================================
   #GRID OS · cloud.js
   Cloud saves through Discord sign-in (Supabase). Nobody has to sign in: the
   app works exactly as before without it, and local saves never stop.

   ONE ROSTER. The roster in this browser stays the only character list. While
   a player is jacked in, each roster record is mirrored to one row of the
   public.characters table (supabase/migrations), the whole record as JSON in
   `data` and its name in `name`:
     - a pull (on jack-in, on start, when the tab comes back into view) brings
       down rows this browser has not seen, and rows changed on another device;
     - a push (2 seconds after the last local save) uploads new and edited
       records;
     - deleting a record through the app deletes its row.
   Conflicts: the last write wins, judged by the row's updated_at against the
   record's own meta.updatedAt.

   THE LINK BOOK (localStorage en_cloud_links_v1) remembers, per account, which
   local record goes with which row:
     { <user id>: { links: { <local id>: { cid, at, lat } },
                    localOnly: { <local id>: 1 }, pendingDel: [cid], uploaded: { <local id>: 1 } } }
   cid is the row id, at the row's updated_at as last seen, lat the record's
   meta.updatedAt when it last matched the row. A record whose updatedAt has
   moved past lat has local edits to upload; a row whose updated_at has moved
   past at was changed somewhere else. The book lives beside the roster rather
   than on the records, so an exported file never carries a row id into
   somebody else's account.

   LOCAL RECORDS FROM BEFORE. On jack-in, records this account has never seen
   are offered once ("Upload N local characters to your account?"). Yes uploads
   them; Not now marks them local only, so the question never repeats for them.
   Local copies are never deleted.

   LOCKED RECORDS. A record that needs a content pack this device has not
   loaded is locked by the store (js/store.js) and is never pushed: pushing
   it would upload a copy drawn without its pack. Pulls still bring it down.

   CONTENT PACKS. Once an account is jacked in, js/packs.js reads what it
   holds and downloads anything newer than its cache. A REAL jack out (Jack
   out, or Supabase rejecting the session: a SIGNED_OUT event, or the stored
   session gone) drops the account's packs from this device.

   OFFLINE AT THE TABLE. Access tokens last an hour. Offline, the refresh fails
   for a network reason and getSession() answers with no session, although the
   session is still stored. That is not a jack out: the player stays jacked in,
   the LINK readout says LINK DOWN, the cached pack stays, and the link comes
   back on its own when the network does.

   WHERE IT SHOWS. The top bar's LINK readout is the cloud indicator, and Jack in
   and Jack out sit in Settings (// CLOUD LINK, first in the tray). Jacking in only
   works on a page served over http(s): Discord sends
   the player back to an address on the project's allow list, and a file://
   page cannot be one. ES5 throughout, like the rest of the app; the vendored
   library (vendor/supabase.min.js) supplies window.supabase.
   ========================================================================= */
window.EN = window.EN || {};

EN.cloud = (function () {
  "use strict";
  var URL_ = "https://ggjgkcnhfpjwyrhakqun.supabase.co";
  // the publishable key is meant to ship in browser code; Row Level Security guards the rows
  var KEY = "sb_publishable_IK6fknnik2P7tPRRuKw0eQ_fTwGfpCE";
  var BOOK = "en_cloud_links_v1";
  var PUSH_DELAY = 2000;

  var client = null, user = null, started = false;
  var status = "off";          // off | ok | syncing | error
  var runP = null, again = false, pushTimer = null, lastPull = 0;
  var awaiting = null;         // local ids held back while the upload question is open
  var loggedMeta = false;
  var offline = false;         // jacked in on a stored session the network could not refresh

  function el() { return EN.ui.el.apply(null, arguments); }
  function store() { return EN.store; }

  /* ---- the link book ---------------------------------------------------- */
  function readAll() {
    try { var v = JSON.parse(localStorage.getItem(BOOK) || "null"); return v && typeof v === "object" ? v : {}; }
    catch (e) { return {}; }
  }
  function book() {
    if (!user) return null;
    var all = readAll(), b = all[user.id];
    if (!b || typeof b !== "object") b = {};
    if (!b.links || typeof b.links !== "object") b.links = {};
    if (!b.localOnly || typeof b.localOnly !== "object") b.localOnly = {};
    if (!Array.isArray(b.pendingDel)) b.pendingDel = [];
    if (!b.uploaded || typeof b.uploaded !== "object") b.uploaded = {};
    return b;
  }
  function saveBook(b) {
    if (!user || !b) return;
    var all = readAll();
    all[user.id] = b;
    try { localStorage.setItem(BOOK, JSON.stringify(all)); } catch (e) { console.error("Could not write the cloud link book", e); }
  }

  /* ---- availability ------------------------------------------------------- */
  function served() { return /^https?:$/.test(location.protocol); }
  function libReady() { return !!(window.supabase && typeof window.supabase.createClient === "function"); }
  function available() { return !!client; }

  /* ---- the player's Discord identity ------------------------------------- */
  function meta() { return (user && user.user_metadata) || {}; }
  function displayName() {
    var m = meta(), c = m.custom_claims || {};
    return c.global_name || m.full_name || m.name || m.user_name || m.preferred_username || "Freelancer";
  }
  function avatar() { return meta().avatar_url || meta().picture || ""; }

  /* ---- records ------------------------------------------------------------ */
  function roster() { return (store() && store().roster && store().roster()) || {}; }
  function rowName(ch) {
    var n = ch && typeof ch.name === "string" ? ch.name.trim() : "";
    return n || "Unnamed Freelancer";
  }
  function payload(ch) { return { name: rowName(ch), data: JSON.parse(JSON.stringify(ch)) }; }
  function stamp(ch) { return ch && ch.meta ? ch.meta.updatedAt : undefined; }
  function eligible(id, b) {
    var ch = roster()[id];
    if (!ch || typeof ch !== "object" || (ch.meta && ch.meta.example)) return false;
    if (store().isLocked && store().isLocked(id)) return false;   // drawn without its pack: never pushed
    if (b.localOnly[id]) return false;
    if (awaiting && awaiting[id]) return false;
    return true;
  }
  function freshId() {
    var r = roster(), id;
    do { id = "c_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); } while (r[id]);
    return id;
  }
  function linkedTo(b, cid) {
    for (var k in b.links) if (Object.prototype.hasOwnProperty.call(b.links, k) && b.links[k].cid === cid) return k;
    return null;
  }

  /* ---- the sync run -------------------------------------------------------
     One run at a time. A request for another while one is going sets `again`,
     and the run goes round once more when it finishes. */
  function sync(opts) {
    if (!client || !user || offline) return Promise.resolve();
    if (runP) { again = (again === "pull" || (opts && opts.pull)) ? "pull" : true; return runP; }
    setStatus("syncing");
    var wantPull = !!(opts && opts.pull);
    runP = (wantPull ? pull() : Promise.resolve())
      .then(deletes)
      .then(push)
      .then(function () { setStatus("ok"); },
            function (e) { console.warn("Cloud sync failed", e); setStatus("error"); })
      .then(function () {
        runP = null;
        if (again) { var p = again === "pull"; again = false; return sync({ pull: p }); }
      });
    return runP;
  }
  function check(res) {
    if (res && res.error) throw res.error;
    return res ? res.data : null;
  }

  // bring down what this browser has not seen, and what changed elsewhere
  function pull() {
    var b = book(), uid = user.id;
    lastPull = Date.now();
    return client.from("characters").select("id, name, updated_at").order("updated_at", { ascending: false })
      .then(check)
      .then(function (rows) {
        if (!user || user.id !== uid) return;
        rows = rows || [];
        var seen = {};
        rows.forEach(function (r) { seen[r.id] = r; });
        // a row gone from the account (deleted on another device): the local copy stays, local only
        Object.keys(b.links).forEach(function (lid) {
          var L = b.links[lid];
          if (!seen[L.cid] && b.pendingDel.indexOf(L.cid) === -1) { delete b.links[lid]; b.localOnly[lid] = 1; }
        });
        var wanted = [];
        rows.forEach(function (r) {
          if (b.pendingDel.indexOf(r.id) !== -1) return;
          var lid = linkedTo(b, r.id);
          if (!lid) { wanted.push({ row: r, lid: null }); return; }
          var ch = roster()[lid];
          if (!ch) return;   // set aside or missing on this device: leave both alone
          var L = b.links[lid];
          if (r.updated_at === L.at) return;
          var dirty = stamp(ch) !== L.lat;
          if (!dirty || Date.parse(r.updated_at) > Number(stamp(ch) || 0)) wanted.push({ row: r, lid: lid });
        });
        saveBook(b);
        // fetch the wanted rows one by one, so one bad row cannot stop the rest
        return wanted.reduce(function (p, w) {
          return p.then(function () {
            return client.from("characters").select("id, data, updated_at").eq("id", w.row.id).maybeSingle().then(check)
              .then(function (full) {
                if (!full || !user || user.id !== uid) return;
                var data = full.data && typeof full.data === "object" ? full.data : null;
                if (!data) return;
                var b2 = book();
                var lid = w.lid;
                if (!lid) {
                  var want = data.meta && typeof data.meta.id === "string" ? data.meta.id : "";
                  lid = want && !roster()[want] && !b2.links[want] ? want : freshId();
                }
                if (!store().putRecord(lid, data)) throw new Error("This device refused the pulled record.");
                b2.links[lid] = { cid: full.id, at: full.updated_at, lat: stamp(roster()[lid]) };
                b2.uploaded[lid] = 1;
                delete b2.localOnly[lid];
                saveBook(b2);
              });
          });
        }, Promise.resolve());
      });
  }

  // rows whose records were deleted through the app
  function deletes() {
    var b = book();
    var list = b.pendingDel.slice();
    return list.reduce(function (p, cid) {
      return p.then(function () {
        return client.from("characters").delete().eq("id", cid).then(check).then(function () {
          var b2 = book(); b2.pendingDel = b2.pendingDel.filter(function (x) { return x !== cid; }); saveBook(b2);
        });
      });
    }, Promise.resolve());
  }

  // upload new records and local edits
  function push() {
    var b = book();
    var jobs = Object.keys(roster()).filter(function (id) {
      if (!eligible(id, b)) return false;
      var L = b.links[id];
      return !L || stamp(roster()[id]) !== L.lat;
    });
    return jobs.reduce(function (p, lid) {
      return p.then(function () { return pushOne(lid); });
    }, Promise.resolve());
  }
  function pushOne(lid) {
    var ch = roster()[lid];
    if (!ch) return Promise.resolve();
    var lat = stamp(ch), body = payload(ch), uid = user.id;
    var L = book().links[lid];
    function insert() {
      return client.from("characters").insert(body).select("id, updated_at").single().then(check);
    }
    var req = L
      ? client.from("characters").update(body).eq("id", L.cid).select("id, updated_at").then(check)
          .then(function (rows) { return rows && rows.length ? rows[0] : insert(); })   // the row went away: last write wins, put it back
      : insert();
    return req.then(function (row) {
      if (!row || !user || user.id !== uid) return;
      var b = book();
      b.links[lid] = { cid: row.id, at: row.updated_at, lat: lat };
      b.uploaded[lid] = 1;
      saveBook(b);
    });
  }

  function schedulePush() {
    if (!client || !user) return;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(function () { sync(); }, PUSH_DELAY);
  }

  /* ---- records from before jack-in ---------------------------------------- */
  function unclaimed() {
    var b = book();
    return Object.keys(roster()).filter(function (id) {
      var ch = roster()[id];
      return ch && !(ch.meta && ch.meta.example) && !b.links[id] && !b.localOnly[id] && !b.uploaded[id];
    });
  }
  // hold the records back from the first sync, so none uploads before the player has answered
  function holdUnclaimed() {
    var ids = unclaimed();
    awaiting = null;
    if (ids.length) { awaiting = {}; ids.forEach(function (id) { awaiting[id] = 1; }); }
    return ids;
  }
  function offerUpload() {
    var held = awaiting || {};
    var ids = unclaimed().filter(function (id) { return held[id]; });
    if (!ids.length) { awaiting = null; return false; }
    var old = document.getElementById("cloud-offer");
    if (old) old.parentNode.removeChild(old);
    var n = ids.length;
    function answer(yes) {
      var box = document.getElementById("cloud-offer");
      if (box) box.parentNode.removeChild(box);
      var b = book();
      if (!yes) ids.forEach(function (id) { b.localOnly[id] = 1; });
      saveBook(b);
      awaiting = null;
      if (yes) sync().then(function () { if (status === "ok") EN.ui.toast(n === 1 ? "1 character uploaded to your account." : n + " characters uploaded to your account."); });
      else EN.ui.toast("Kept on this device only.");
    }
    document.body.appendChild(el("div#cloud-offer", { role: "dialog", "aria-label": "Upload local characters" }, [
      el("div.cloud-offer-card", null, [
        el("p", { text: n === 1 ? "Upload 1 local character to your account?" : "Upload " + n + " local characters to your account?" }),
        el("p.help", { text: "The copies on this device stay where they are." }),
        el("div.row", null, [
          el("button.btn", { "data-cloud-upload": "yes", onclick: function () { answer(true); } }, "UPLOAD"),
          el("button.btn", { "data-cloud-upload": "no", onclick: function () { answer(false); } }, "NOT NOW")
        ])
      ])
    ]));
    return true;
  }

  /* ---- uploading a local-only character later ---------------------------------
     A character kept local (Not now on the upload question, or one whose row was deleted on
     another device) can still go up: the character manager has an upload button on its row,
     and Settings has one for all of them (the author, 7 Nov 2026). */
  function localOnlyIds() {
    if (!user) return [];
    var b = book();
    return Object.keys(roster()).filter(function (id) {
      var ch = roster()[id];
      return ch && !(ch.meta && ch.meta.example) && b.localOnly[id] && !b.links[id];
    });
  }
  function upload(ids) {
    if (!client || !user) return Promise.resolve(0);
    var b = book(), n = 0;
    (ids || []).forEach(function (id) { if (b.localOnly[id] && roster()[id]) { delete b.localOnly[id]; n++; } });
    saveBook(b);
    if (!n) return Promise.resolve(0);
    paint();
    return sync().then(function () {
      if (status === "ok") EN.ui.toast(n === 1 ? "1 character uploaded to your account." : n + " characters uploaded to your account.");
      else EN.ui.toast("Could not reach your account. The upload will finish when the link is back.");
      if (EN.app && EN.app.render) EN.app.render();
      return n;
    });
  }

  /* ---- sign in, sign out ---------------------------------------------------- */
  function returnUrl() {
    // back to whichever domain and folder the player started on (both are on the allow list)
    return location.origin + location.pathname.replace(/[^\/]*$/, "");
  }
  function jackIn(provider) {
    if (!client) return Promise.resolve();
    // guilds.members.read: the playtest gate reads the Play tester role in the Elysium Nights server
    var opts = { redirectTo: returnUrl() };
    if ((provider || "discord") === "discord") opts.scopes = "guilds.members.read";
    return client.auth.signInWithOAuth({ provider: provider || "discord", options: opts })
      .then(function (res) { if (res && res.error) throw res.error; })
      .catch(function (e) { console.error("Jack in failed", e); EN.ui.toast("Could not reach Discord. Try again in a moment."); });
  }
  function jackOut() {
    if (!client) return Promise.resolve();
    clearTimeout(pushTimer);
    var flush = user ? sync() : Promise.resolve();   // one last push, so nothing edited is left behind
    return flush.then(function () { return client.auth.signOut(); })
      .then(function () { EN.ui.toast("Jacked out. Your characters stay on this device."); })
      .catch(function (e) { console.error("Jack out failed", e); });
  }

  function setUser(next) {
    var prev = user ? user.id : null;
    user = next || null;
    awaiting = null;
    var box = document.getElementById("cloud-offer");
    if (box && (!user || user.id !== prev)) box.parentNode.removeChild(box);
    if (!user) { setStatus("off"); return; }
    if (!loggedMeta) { loggedMeta = true; try { console.info("Discord profile fields", Object.keys(meta())); } catch (e) {} }
    if (user.id !== prev) {
      var me = user.id;
      holdUnclaimed();
      sync({ pull: true }).then(function () { if (user && user.id === me && awaiting) offerUpload(); });
      refreshPacks();
    }
    paint();
  }
  /* ---- the playtest gate ------------------------------------------------------
     During the playtest the Freelancer's Companion (EN1101) is granted, not open to every account.
     Right after a Discord sign-in the session carries Discord's access token (provider_token, for
     that sign-in only); the discord-role Edge Function (supabase/functions/discord-role) reads the
     Play tester role with it and writes or removes the grant before the packs are asked for. A
     session restored from storage has no token, so the grant from the last sign-in stands. */
  var roleToken = null, checkedTokens = {};
  function noteToken(s) { var t = s && s.provider_token; if (t && !checkedTokens[t]) roleToken = t; }
  function checkRole() {
    var t = roleToken;
    roleToken = null;
    if (!t || !client || !client.functions) return Promise.resolve();
    checkedTokens[t] = true;
    return Promise.resolve().then(function () { return client.functions.invoke("discord-role", { body: { token: t } }); })
      .then(function (res) { if (res && res.error) console.warn("Play tester check failed", res.error); })
      .catch(function (e) { console.warn("Play tester check failed", e); });
  }
  function refreshPacks() {
    if (!(client && user && !offline && EN.packs && EN.packs.refresh)) return Promise.resolve();
    var c = client, id = user.id;
    return checkRole().then(function () { if (user && user.id === id && !offline) return EN.packs.refresh(c, id); });
  }

  /* ---- the stored session, for the offline case ----------------------------------
     The vendored client keeps the session in localStorage (EN.packs reads the same entry at boot).
     A refresh that fails for a network reason leaves it there; a rejected one removes it. */
  function storedUser() {
    var s = EN.packs && EN.packs.storedSession ? EN.packs.storedSession() : null;
    return s && s.user && s.user.id ? s.user : null;
  }
  function goOffline(u) {
    offline = true;
    user = u;
    setStatus("error");
  }
  function backOnline(u) {
    var was = offline;
    offline = false;
    user = u;
    if (was) { sync({ pull: true }); refreshPacks(); }
    paint();
  }
  // a real jack out: the account's packs leave this device
  function signedOut() {
    var prev = user;
    offline = false;
    setUser(null);
    if (EN.packs && EN.packs.drop) EN.packs.drop(prev ? prev.id : null);
  }

  /* ---- the LINK readout ------------------------------------------------------
     The top bar's LINK readout (and the '98 tray's ⇋, which stands in for it there) is the
     cloud indicator (the author, 7 Nov 2026): LINK STABLE when the account is reachable and
     saved, LINK SYNC… while an upload runs, LINK DOWN when the account cannot be reached, and
     LOCAL while nobody is jacked in. SYNC OK beside it stays the save on this device.
     Jack in and Jack out live in Settings (js/settings.js, // CLOUD LINK). */
  var LINK_TEXT = { off: "LOCAL", ok: "LINK STABLE", syncing: "LINK SYNC…", error: "LINK DOWN" };
  var LINK_COLOR = { off: "var(--text3)", ok: "var(--success)", syncing: "var(--warn)", error: "var(--danger)" };
  function linkState() { return user ? (LINK_TEXT[status] ? status : "ok") : "off"; }
  function linkTip() {
    var k = linkState();
    if (k === "off") return client
      ? "Not jacked in: characters save to this device only. Jack in with Discord from Settings to save them to your account."
      : "No cloud link on this copy of the app: characters save to this device only.";
    if (k === "syncing") return "Jacked in as " + displayName() + ". Saving to your account.";
    if (k === "error") return "Jacked in as " + displayName() + ", but your account cannot be reached. Characters are still saved on this device, and upload when the link is back.";
    return "Jacked in as " + displayName() + ". Your characters are saved to your account.";
  }
  function setStatus(s) { status = s; paint(); }
  function paint() {
    var k = linkState(), tip = linkTip();
    var span = document.getElementById("link-state");
    if (span) {
      var led = span.querySelector(".led");
      span.lastChild.nodeValue = LINK_TEXT[k];
      span.title = tip;
      span.setAttribute("data-link", k);
      span.style.color = k === "off" ? "" : LINK_COLOR[k];
      if (led) led.className = "led led-" + k;
    }
    var g = document.getElementById("os-tray-link");
    if (g) { g.title = LINK_TEXT[k] + ". " + tip; g.style.color = k === "ok" ? "" : LINK_COLOR[k]; }
    // the Settings tray's // CLOUD LINK section, when it is open: its status line updates in place,
    // and the tray is redrawn only when who is jacked in changes (not on every upload)
    var st = document.getElementById("cloud-set-state"), hint = document.getElementById("cloud-set-hint");
    if (st) { st.textContent = LINK_TEXT[k]; st.style.color = LINK_COLOR[k]; st.setAttribute("data-cloud-status", k); }
    if (hint) hint.textContent = tip;
    var who = user ? user.id : "";
    if (who !== paintedWho) { paintedWho = who; if (EN.settings && EN.settings.refresh) EN.settings.refresh(); }
  }
  var paintedWho = "";

  /* ---- the sign-in buttons ---------------------------------------------------------
     One button per sign-in provider, drawn by // CLOUD LINK and by // CONTENT (js/settings.js) alike.
     Adding a provider (Google is next) is one more row in PROVIDERS. Nothing anywhere checks
     which provider a player used. */
  var PROVIDERS = [
    { key: "discord", label: "JACK IN WITH DISCORD", title: "Jack in with Discord" }
  ];
  function signInButtons() {
    return PROVIDERS.map(function (p, i) {
      return el("button.btn.primary.cloud-in", { type: "button", "data-cloud": "in", "data-provider": p.key, title: p.title,
        style: { width: "100%", marginTop: i ? "8px" : "" }, onclick: function () { jackIn(p.key); } }, p.label);
    });
  }

  /* ---- the Settings section (js/settings.js draws it, first in the tray) ------- */
  function settingsSection() {
    var k = linkState();
    var kids = [el("div.set-sectitle", { text: "// CLOUD LINK", dataset: { sum: user ? "JACKED IN" : "NOT JACKED IN" } })];
    if (!client) {
      kids.push(el("p.set-hint", { text: "Cloud saves work on the live site, elysiumnightsrpg.com/app. Here, characters save to this device only." }));
      return kids;
    }
    if (!user) {
      kids.push(el("p.set-hint", { text: "Jack in with Discord to save your characters to your account, so they follow you to any browser. Play-testers with the Play tester role on the Elysium Nights Discord also unlock the Freelancer's Companion. Characters on this device stay where they are." }));
      return kids.concat(signInButtons());
    }
    var pic = avatar();
    kids.push(el("div.cloud-who", null, [
      pic ? el("img.cloud-av", { src: pic, alt: "", referrerpolicy: "no-referrer" }) : el("span.cloud-av.cloud-av-blank"),
      el("div.cloud-who-text", null, [
        el("div.cloud-name", { text: displayName() }),
        el("div#cloud-set-state.cloud-state", { "data-cloud-status": k, style: { color: LINK_COLOR[k] }, text: LINK_TEXT[k] })
      ])
    ]));
    kids.push(el("p#cloud-set-hint.set-hint", { text: linkTip() }));
    var lo = localOnlyIds();
    if (lo.length) kids.push(el("button.btn.primary", { type: "button", "data-cloud": "upload-all", style: { width: "100%", marginBottom: "8px" },
      title: "Upload the characters kept on this device only, so they follow you to any browser",
      onclick: function () { upload(localOnlyIds()).then(function () { if (EN.settings && EN.settings.refresh) EN.settings.refresh(); }); } },
      lo.length === 1 ? "⤒ UPLOAD 1 LOCAL-ONLY CHARACTER" : "⤒ UPLOAD " + lo.length + " LOCAL-ONLY CHARACTERS"));
    kids.push(el("button.btn", { type: "button", "data-cloud": "out", title: "Jack out. Your characters stay on this device.", style: { width: "100%" },
      onclick: function () { jackOut(); } }, "JACK OUT"));
    return kids;
  }

  /* ---- start ----------------------------------------------------------------- */
  function wire(c) {
    client = c;
    c.auth.onAuthStateChange(function (event, session) {
      // supabase-js asks that nothing awaits inside this callback, so the work runs on the next turn
      var u = session && session.user ? session.user : null;
      setTimeout(function () {
        if (u) {
          noteToken(session);
          if (offline && user && user.id === u.id) backOnline(u);
          else if (u.id !== (user && user.id)) { offline = false; setUser(u); }
          else { user = u; paint(); if (roleToken) refreshPacks(); }   // jacked in again: check the role again
          return;
        }
        // no session: a real sign-out, or only a refresh the network stopped
        var kept = storedUser();
        if (event === "SIGNED_OUT" || !kept) {
          if (user || offline) signedOut();
          // rejected before anyone was set here: the packs the boot merged still leave
          else if (event === "SIGNED_OUT" && EN.packs && EN.packs.drop) EN.packs.drop(null);
          return;
        }
        if (!user) goOffline(kept);
      }, 0);
    });
    c.auth.getSession().then(function (res) {
      var s = res && res.data ? res.data.session : null;
      if (s && s.user) { noteToken(s); if (offline && user && user.id === s.user.id) backOnline(s.user); else if (!user || user.id !== s.user.id) setUser(s.user); return; }
      var kept = storedUser();
      if (kept && !user) goOffline(kept);
    }).catch(function (e) {
      console.warn("Cloud session check failed", e);
      var kept = storedUser();
      if (kept && !user) goOffline(kept);
    });
    paint();
  }
  function start() {
    if (started) return;
    started = true;
    if (store() && store().onSave) store().onSave(function (ok) { if (ok) schedulePush(); });
    if (store() && store().onRemove) store().onRemove(function (id) {
      if (!user) return;
      var b = book(), L = b.links[id];
      delete b.localOnly[id];
      delete b.uploaded[id];
      if (L) { delete b.links[id]; if (b.pendingDel.indexOf(L.cid) === -1) b.pendingDel.push(L.cid); }
      saveBook(b);
      if (L) sync();
    });
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "visible" && user && Date.now() - lastPull > 30000) sync({ pull: true });
    });
    window.addEventListener("online", function () {
      if (offline && client) {
        // the stored session gets its refresh now; onAuthStateChange brings the link back
        client.auth.getSession().then(function (res) {
          var s = res && res.data ? res.data.session : null;
          if (s && s.user) backOnline(s.user);
        }).catch(function () {});
        return;
      }
      if (user) { sync({ pull: true }); refreshPacks(); }
    });
    if (!served() || !libReady()) { paint(); return; }
    try {
      wire(window.supabase.createClient(URL_, KEY, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: "pkce" }
      }));
    } catch (e) { console.error("Cloud saves unavailable", e); client = null; paint(); }
  }

  return {
    start: start, jackIn: jackIn, jackOut: jackOut, sync: sync, paint: paint, settingsSection: settingsSection,
    signInButtons: signInButtons, recheck: function () { return jackIn("discord"); },
    available: available,
    signedIn: function () { return !!user; },
    status: function () { return status; },
    // whether deleting this record also deletes a row in the player's account (the delete warnings)
    linked: function (id) { var b = user ? book() : null; return !!(b && b.links[id]); },
    // characters kept on this device only while jacked in, and the upload that sends them up
    localOnly: function (id) { return localOnlyIds().indexOf(id) !== -1; },
    upload: upload,
    // the test suite swaps in a stand-in client (no network, no Discord)
    _useClient: function (c) { start(); user = null; offline = false; wire(c); },
    offline: function () { return offline; }
  };
})();
