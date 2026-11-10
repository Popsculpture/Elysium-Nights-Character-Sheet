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
                    localOnly: { <local id>: 1 }, pendingDel: [cid], uploaded: { <local id>: 1 },
                    filing: { <local id>: stamp }, unmarked: [row id] } }
   cid is the row id, at the row's updated_at as last seen, lat the record's
   meta.updatedAt when it last matched the row. A record whose updatedAt has
   moved past lat has local edits to upload; a row whose updated_at has moved
   past at was changed somewhere else. filing and unmarked belong to THE INBOX below. The book lives beside the roster rather
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

   CAMPAIGNS. characters.campaign_id is account state, like this link book. It is
   not in `data`, so nothing here sends it and an export never carries it. js/campaigns.js
   reads and writes that column itself, through rowOf and ensureRow below. Whoever runs
   a campaign can read its members' rows, so a pull asks for this account's rows by name:
   anything else would pull other players' characters into the Admin's roster.

   THE INBOX. #POST from the Admin (campaigns batch 3). The character_inbox table is the
   courier, and the record is still where mail lives. See THE INBOX below.

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
    if (!b.filing || typeof b.filing !== "object") b.filing = {};
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
  /* The link book is one per browser and shared between tabs, so before this trusts it about a record, the record
     has to be the newest this browser has. Read the book FIRST, then this: writes reach another tab in order, and a
     save goes in before the note about it, so a tab that can see the note can see the save. */
  function hearTabs() { var s = store(); if (s && s.syncTabs) s.syncTabs(); }
  /* Behind what this browser last synced: a copy no tab should keep or send. An edit always moves a stamp forward. */
  function behind(ch, L) { return Number(stamp(ch)) < Number(L.lat); }
  /* ONE RUN AT A TIME, ACROSS TABS. Tabs share one link book, and a run reads it, waits on the network, and acts on what it
     read. Side by side, two runs both pull a new row and make two characters of it, both see a new record as unlinked and
     insert two rows, or one takes the other's new row for deleted elsewhere. The browser's lock makes them take turns.
     A tab that can't have the lock (file://, an old browser), or has waited too long for a stuck one, runs anyway,
     as every tab did before. */
  var LOCK_WAIT = 20000;
  function oneAtATime(fn) {
    var L = null;
    try { L = navigator.locks; } catch (e) {}
    if (!L || typeof L.request !== "function") return Promise.resolve().then(fn);
    var started = false, ctl = typeof AbortController === "function" ? new AbortController() : null, t = null;
    if (ctl) t = setTimeout(function () { ctl.abort(); }, LOCK_WAIT);
    return L.request("en_cloud_sync", ctl ? { signal: ctl.signal } : {}, function () {
      started = true;
      clearTimeout(t);
      return fn();
    }).then(null, function (e) {
      clearTimeout(t);
      if (started) throw e;
      return fn();
    });
  }
  function eligible(id, b) {
    var ch = roster()[id];
    if (!ch || typeof ch !== "object" || (ch.meta && (ch.meta.example || ch.meta.viewing))) return false;
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
    var wantPull = !!(opts && opts.pull), pulled = false;
    function finish() {
      runP = null;
      if (again) { var p = again === "pull"; again = false; return sync({ pull: p }); }
    }
    runP = oneAtATime(function () {
      // the wait for the lock can outlast the session
      if (!client || !user || offline) return;
      hearTabs();
      return (wantPull ? pull().then(function () { pulled = true; }) : Promise.resolve())
        .then(deletes)
        .then(push)
        .then(function () { setStatus("ok"); },
              function (e) { console.warn("Cloud sync failed", e); setStatus("error"); })
        // beside the sync, never inside it: a failure over there costs the campaign list and nothing else
        .then(function () { if (wantPull && EN.campaigns && EN.campaigns.refresh) EN.campaigns.refresh(); })
        // after it, inside the run: a pull landing halfway through filing a message would lose the message
        .then(function () { return inbox(pulled, wantPull); });
    }).then(function () {
      // beside the sync again: what the Admin desktop has waiting to send, for other players' sheets. A sync is how it hears the link is back
      if (EN.gmStore && EN.gmStore.flushSends) EN.gmStore.flushSends();
      return finish();
    }, function (e) { console.warn("Cloud sync failed", e); setStatus("error"); return finish(); });
    return runP;
  }
  function check(res) {
    if (res && res.error) throw res.error;
    return res ? res.data : null;
  }

  // bring down what this browser has not seen, and what changed elsewhere
  function pull() {
    var uid = user.id, linksBefore = book().links;
    lastPull = Date.now();
    // this account's own rows, by name: the Admin of a campaign can read its members' rows too (see the note above)
    return client.from("characters").select("id, name, updated_at").eq("owner_id", uid).order("updated_at", { ascending: false })
      .then(check)
      .then(function (rows) {
        if (!user || user.id !== uid) return;
        // read after the wait, not before it: another tab may have written the book meanwhile, and this one writes it back whole
        var b = book();
        hearTabs();
        rows = rows || [];
        var seen = {};
        rows.forEach(function (r) { seen[r.id] = r; });
        // a row gone from the account (deleted on another device): the local copy stays, local only
        Object.keys(b.links).forEach(function (lid) {
          var L = b.links[lid];
          // only a link older than this list can be missing from it: a tab may have just made one
          if (linksBefore[lid] && linksBefore[lid].cid === L.cid && !seen[L.cid] && b.pendingDel.indexOf(L.cid) === -1) { delete b.links[lid]; delete b.filing[lid]; b.localOnly[lid] = 1; }
        });
        var wanted = [];
        rows.forEach(function (r) {
          if (b.pendingDel.indexOf(r.id) !== -1) return;
          var lid = linkedTo(b, r.id);
          if (!lid) { wanted.push({ row: r, lid: null }); return; }
          var ch = roster()[lid];
          if (!ch) return;   // set aside or missing on this device: leave both alone
          var L = b.links[lid], old = behind(ch, L);
          if (r.updated_at === L.at && !old) return;
          var dirty = stamp(ch) !== L.lat;
          // ahead by mail alone, the row always wins: see THE COPY MAY ONLY BE AHEAD BY THE MAIL
          if (old || !dirty || aheadByMail(lid, b) || Date.parse(r.updated_at) > Number(stamp(ch) || 0)) wanted.push({ row: r, lid: lid, at: stamp(ch) });
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
                hearTabs();
                var lid = w.lid;
                if (lid) {
                  // it moved during the fetch: an edit or a delete, in this tab or another. That's newer than this decision
                  var nowCh = roster()[lid];
                  if (!nowCh || stamp(nowCh) !== w.at) return;
                }
                if (!lid) {
                  if (linkedTo(b2, full.id)) return;   // another tab took this new row while it was fetched
                  var want = data.meta && typeof data.meta.id === "string" ? data.meta.id : "";
                  lid = want && !roster()[want] && !b2.links[want] ? want : freshId();
                }
                if (!store().putRecord(lid, data)) throw new Error("This device refused the pulled record.");
                delete b2.filing[lid];
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
    hearTabs();
    var jobs = Object.keys(roster()).filter(function (id) {
      if (!eligible(id, b)) return false;
      var L = b.links[id];
      if (!L) return true;
      // different from what the book says isn't the same as newer: an old copy is never something to send
      return stamp(roster()[id]) !== L.lat && !behind(roster()[id], L);
    });
    return jobs.reduce(function (p, lid) {
      return p.then(function () { return aheadByMail(lid, book()) ? pushFiled(lid) : pushOne(lid); });
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
    return req.then(function (row) { noteRow(lid, row, lat, uid); });
  }
  function noteRow(lid, row, lat, uid) {
    if (!row || !user || user.id !== uid) return;
    var b = book();
    b.links[lid] = { cid: row.id, at: row.updated_at, lat: lat };
    b.uploaded[lid] = 1;
    delete b.filing[lid];
    saveBook(b);
  }
  /* A record ahead of the account by mail alone: see THE INBOX below. A push of one lands only on the row as
     this device last saw it, because a device that only changed since a letter came has no business winning a
     race against the device somebody is actually playing on. If the row moved it does nothing and asks for a
     pull, which takes the row's copy. Answers whether it landed. */
  function aheadByMail(lid, b) {
    var ch = roster()[lid], at = b.filing[lid];
    return at !== undefined && !!ch && stamp(ch) === at;
  }
  function pushFiled(lid) {
    var ch = roster()[lid], L = book().links[lid];
    if (!ch || !L) return Promise.resolve(false);
    var lat = stamp(ch), uid = user.id;
    return client.from("characters").update(payload(ch)).eq("id", L.cid).eq("updated_at", L.at).select("id, updated_at").then(check)
      .then(function (rows) {
        if (!rows || !rows.length) { again = "pull"; return false; }
        noteRow(lid, rows[0], lat, uid);
        return true;
      });
  }

  function schedulePush() {
    if (!client || !user) return;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(function () { sync(); }, PUSH_DELAY);
  }

  /* ---- THE INBOX: #POST from the Admin ---------------------------------------------
     Each character_inbox row is one message on its way to one character. While jacked in this
     listens with Realtime, and reads waiting rows after every sync, which is how mail that came
     while the player was away arrives. Each row goes on the record through EN.gmStore.deliverMail,
     up to the account, then mark_delivered, and then the toast. Only this device's account ever
     writes its records.

     WHAT IT READS. The account's own characters, asked for by id. An Admin can read everything they
     sent, so a read with no filter would answer with other players' mail. A row for a record that
     isn't on this device, or is locked, stays waiting.

     A PULL COMES FIRST. A device sitting idle holds an old copy of its records, and until now it
     never pushed one. Filing mail on that copy would make it the newest copy there is, and its push
     would overwrite whatever the player did since on the device they are actually using. So a row
     is filed only straight after a pull that worked: a run that had none finds rows, and asks for
     another run that does. A run whose pull failed leaves them waiting, and does not ask again, or a
     dropped network would spin. Rows are only filed from inside a run, so the two can't interleave.

     THE ACCOUNT BEFORE THE MARK. Delivered has to mean the mail is somewhere another device can get
     it. A device that marked first and closed inside the two-second push delay would leave the row
     saying delivered and the message on that device alone, and nobody would ever file it again. So the
     record goes up first, and a row is marked only if that landed.

     THE COPY MAY ONLY BE AHEAD BY THE MAIL. A pull comes first, but another device can push in the
     moment after it, so a row is filed only on a copy with nothing else waiting to go up: real edits
     go first, by the ordinary push, and if that failed the row waits. The link book then remembers the
     stamp the record has after the filing (`filing`). While the record still has that stamp, all it
     holds that the account doesn't is mail, and two rules hold, in every run and across a reload. Its
     push only lands on the row as this device last saw it (pushFiled). And if the row has moved, a
     pull takes the row's copy, whatever the clocks say. They can't be asked: the filing is stamped a
     moment after the other device's save, and would read as the newer edit. The row is still waiting,
     so it is filed again on top, and `told` keeps it to one toast. The moment the player edits, the
     stamp moves, and it is an ordinary record under last write wins again, with nothing thrown away.

     A TAB NOBODY IS LOOKING AT DOESN'T FILE. It would race the device in use, and its toast would be
     gone before anyone saw it. Rows wait until it comes back into view (`waitingForView`), and the
     player sees the toast then.

     TWO DEVICES AT ONCE. The first to mark a row delivered takes it out of everyone's waiting list,
     and a second device that then stayed silent would hold a copy with no message, and overwrite the
     first device's on its next save. So what Realtime says about a row (`wanted`) counts as well as
     what is waiting: this device files any row it hears about that its copy has not filed, and a
     refusal saying "already delivered" is only news. Each copy holds the message once, and
     meta.inboxApplied is what says so.

     A RECALL IN BETWEEN. A row can be recalled after this device read it and before it was marked,
     or while a network failure kept the mark from landing, and a recalled row is on nobody's waiting
     list. So the link book keeps the rows this device filed and has not got an answer for
     (`unmarked`), and they are read whatever their status. A recall takes the message back off the
     record, unless the player has opened it. Then only the package goes, at Take it (js/face.js).

     TAKE IT REPORTS THROUGH A QUEUE (en_inbox_taken_v1, row ids). A package can be taken while
     jacked out or offline, because it is already on the record. The report goes when it can, after
     the delivery it depends on. A device queue rather than the link book, since nobody may be jacked
     in when it is written. A refusal drops it: another account on this device would be refused too,
     and all that costs is the word Taken on somebody's list.

     LOST MAIL COMES BACK. Delivered is a promise that a copy exists, and a copy can still be saved over: by another
     device, under last write wins. Nobody would ever file that row again. So a run with a pull behind it also asks
     which of this account's delivered rows its records don't list, and files those the ordinary way, safe behind the
     rules above. A message the player deleted is still listed in meta.inboxApplied, so it stays deleted, unless the
     copy that was saved over the sheet predates it. A package taken is `taken`, not delivered, so it can't come twice.
     It looks at the newest LOST_LOOK letters only, and files LOST_FILE a run: a message with no package stays delivered
     for good, and one read shouldn't grow with them. A row with numbers has no such horizon, and goes first: a wallet
     short by a payday isn't the same as a lost letter, and there are far fewer of them. PostgREST's own row limit is the limit.

     A ROW WITH OPS (a payday, an XP award, a milestone) changes numbers as well, in the same write as the message
     (EN.gmStore.deliverMail), so everything above holds for it unchanged: filed after a pull, on a clean copy, up to the
     account before it's marked, and once per copy, because meta.inboxApplied says which rows a copy holds. It has its own
     two statuses, due and applied, and its own mark_applied. A tab from before this can't see them, so it can't file one
     as plain mail and lose the numbers. It can't be recalled, so a row with ops never takes the withdraw paths here.

     IT FAILS QUIETLY. No table, no Realtime, no network: the mail waits, the character sync never
     hears about it, and one warning goes to the console. */
  var TAKEN_KEY = "en_inbox_taken_v1";
  var channel = null, channelOf = null;
  var wanted = {};            // row ids Realtime spoke of, to read whatever their status
  var told = {};              // row ids this device has shown a toast for, this session
  var waitingForView = false; // a hidden tab left mail waiting: coming back into view reads it, however recent the last pull
  var inboxWarned = false;
  var hasLanded = false, heldMail = [];

  function inboxWarn(e) {
    if (inboxWarned) return;
    inboxWarned = true;
    console.warn("The inbox could not be read. Mail waits until it can.", e);
  }
  function filed(ch, rowId) {
    var a = ch && ch.meta && ch.meta.inboxApplied;
    return Array.isArray(a) && a.indexOf(rowId) !== -1;
  }
  function pad2(n) { return (n < 10 ? "0" : "") + n; }
  var DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  // a row's created_at in the When a Job Board posting writes
  function whenOf(iso) {
    var t = new Date(iso);
    return isNaN(t.getTime()) ? "" : pad2(t.getHours()) + ":" + pad2(t.getMinutes()) + ", " + DAYS[t.getDay()];
  }
  var SELECT_ROW = "id, character_id, mail, ops, status, created_at";
  var LOST_LOOK = 100, LOST_FILE = 20;
  function unmarked(b) { return Array.isArray(b.unmarked) ? b.unmarked : []; }
  function setUnmarked(rowId, on) {
    var b = book(), list = unmarked(b).filter(function (x) { return x !== rowId; });
    if (on) list.push(rowId);
    if (list.length) b.unmarked = list; else delete b.unmarked;
    saveBook(b);
  }
  function lostRead(status, cids, max) {
    var ask = client.from("character_inbox").select("id, character_id").eq("status", status).in("character_id", cids).order("created_at", { ascending: false });
    return (max ? ask.limit(max) : ask).then(check).then(null, function (e) { inboxWarn(e); return []; });
  }
  function readRows(pulled) {
    var b = book(), cids = Object.keys(b.links).map(function (k) { return b.links[k].cid; });
    if (!cids.length) return Promise.resolve([]);
    var ask = Object.keys(wanted).filter(function (id) { return wanted[id]; }), open = unmarked(b);
    wanted = {};
    return Promise.resolve().then(function () {
      return Promise.all([
        client.from("character_inbox").select(SELECT_ROW).in("status", ["waiting", "due"]).in("character_id", cids).order("created_at", { ascending: true }).then(check),
        ask.length ? client.from("character_inbox").select(SELECT_ROW).in("id", ask).in("character_id", cids).neq("status", "recalled").then(check) : [],
        open.length ? client.from("character_inbox").select(SELECT_ROW).in("id", open).then(check) : [],
        // LOST MAIL COMES BACK. Its own failure costs only this: the rest of the read still stands
        pulled ? lostRead("applied", cids) : [],
        pulled ? lostRead("delivered", cids, LOST_LOOK) : []
      ]);
    }).then(function (all) {
      // a row this device was still waiting to hear about that is simply gone went with its campaign
      var there = (all[2] || []).map(function (r) { return r.id; });
      open.forEach(function (id) { if (there.indexOf(id) === -1) setUnmarked(id, false); });
      var seen = {}, rows = [];
      (all[0] || []).concat(all[1] || [], all[2] || []).forEach(function (r) { if (!seen[r.id]) { seen[r.id] = 1; rows.push(r); } });
      var bookNow = book();
      var lost = (all[3] || []).concat(all[4] || []).filter(function (r) {
        var lid = linkedTo(bookNow, r.character_id), ch = lid ? roster()[lid] : null;
        return !seen[r.id] && !!ch && !filed(ch, r.id);
      }).map(function (r) { return r.id; }).slice(0, LOST_FILE);
      if (!lost.length) return rows;
      return client.from("character_inbox").select(SELECT_ROW).in("id", lost).then(check).then(function (more) {
        return rows.concat(more || []);
      }, function (e) { inboxWarn(e); return rows; });
    }, function (e) {
      ask.forEach(function (id) { wanted[id] = 1; });
      throw e;
    });
  }
  // the record this row is for, if this device can write it. Anything else stays waiting
  function writable(r) {
    var lid = linkedTo(book(), r.character_id), ch = lid ? roster()[lid] : null;
    return ch && !(store().isLocked && store().isLocked(lid)) ? lid : null;
  }
  function refusalOf(e) { return e && e.message ? String(e.message) : ""; }
  function isClean(lid, b) {
    var L = b.links[lid], ch = roster()[lid];
    return !!L && !!ch && stamp(ch) === L.lat;
  }
  // a write only the courier made: a copy that was ahead by mail alone, or level, still is afterwards
  function courierWrite(lid, write) {
    var b = book();
    hearTabs();
    var quiet = isClean(lid, b) || aheadByMail(lid, b);
    var done = write();
    if (done && quiet) { b = book(); b.filing[lid] = stamp(roster()[lid]); saveBook(b); }
    return done;
  }
  function fileRows(rows, uid, came, pulled) {
    var todo = [], touched = [], stuck = {};
    rows.forEach(function (r) {
      if (!user || user.id !== uid) return;
      var lid = writable(r);
      if (!lid) return;
      if (r.status === "recalled") {
        courierWrite(lid, function () { return EN.gmStore.withdrawMail(lid, r.id); });
        setUnmarked(r.id, false);
        return;
      }
      var mail = r.mail || {};
      var b = book();
      hearTabs();
      if (!filed(roster()[lid], r.id)) {
        if (!isClean(lid, b) && !aheadByMail(lid, b)) return;   // real edits have not gone up: this row waits for them
        var landed = courierWrite(lid, function () {
          return EN.gmStore && EN.gmStore.deliverMail(lid, r.id, { from: mail.from, subj: mail.subj, body: mail.body, package: mail.package, when: mail.when || whenOf(r.created_at) }, r.ops);
        });
        if (!landed) return;   // this device would not store it
        setUnmarked(r.id, true);
        if (!told[r.id]) {
          told[r.id] = 1;
          came.push({ row: r.id, lid: lid, from: typeof mail.from === "string" ? mail.from : "", pkg: Array.isArray(mail.package) && mail.package.length > 0 });
        }
      }
      todo.push({ id: r.id, lid: lid, mark: r.ops ? "mark_applied" : "mark_delivered" });
      if (touched.indexOf(lid) === -1) touched.push(lid);
    });
    // up to the account first: delivered has to mean somewhere another device can get it
    return touched.reduce(function (p, lid) {
      return p.then(function () {
        var b = book();
        if (isClean(lid, b)) return;   // nothing here the account doesn't have
        // real edits since, or a run with no pull behind it: this run's ordinary push has had its chance
        if (!pulled || !aheadByMail(lid, b) || !eligible(lid, b)) { stuck[lid] = 1; return; }
        return pushFiled(lid).then(function (ok) { if (!ok) stuck[lid] = 1; }, function (e) { stuck[lid] = 1; inboxWarn(e); });
      });
    }, Promise.resolve()).then(function () {
      return todo.reduce(function (p, t) {
        return p.then(function () {
          if (stuck[t.lid] || !user || user.id !== uid) return;
          return client.rpc(t.mark, { p_id: t.id }).then(check).then(function () { return ""; }, refusalOf).then(function (refusal) {
            if (refusal === "EN_RECALLED") {
              courierWrite(t.lid, function () { return EN.gmStore.withdrawMail(t.lid, t.id); });
              came.forEach(function (x, i) { if (x.row === t.id) came.splice(i, 1); });
            }
            // a network failure leaves it open, and the next read marks it. Anything else is an answer
            if (!refusal || /^EN_/.test(refusal)) setUnmarked(t.id, false);
          });
        });
      }, Promise.resolve());
    });
  }
  function tabHidden() {
    try { return document.visibilityState === "hidden"; } catch (e) { return false; }
  }
  function inbox(pulled, tried) {
    if (!client || !user || offline) return Promise.resolve();
    var uid = user.id, came = [];
    return readRows(pulled).then(function (rows) {
      if (!user || user.id !== uid) return;
      var fresh = rows.some(function (r) { var lid = writable(r); return lid && r.status !== "recalled" && !filed(roster()[lid], r.id); });
      if (fresh && (tabHidden() || !pulled)) {
        rows.forEach(function (r) { if (r.status !== "recalled") wanted[r.id] = 1; });
        if (tabHidden()) waitingForView = true;
        // something to file on a copy that hasn't just been brought up to date: go round again with a pull,
        // unless this run's just failed, and then it waits for the next sync
        else if (!tried) again = "pull";
        return;
      }
      return fileRows(rows, uid, came, pulled);
    }).catch(inboxWarn).then(function () {
      if (came.length) tellMail(came);
      return flushTaken();
    }).catch(inboxWarn);
  }

  /* ---- the toast waits for the desktop ---- */
  function tellMail(items) {
    if (!hasLanded) { heldMail = heldMail.concat(items); return; }
    if (EN.faceView && EN.faceView.postToast) EN.faceView.postToast(items);
  }
  function landed() {
    hasLanded = true;
    var held = heldMail;
    heldMail = [];
    if (held.length) tellMail(held);
  }

  /* ---- Take it reports back ---- */
  function readTaken() {
    try { var v = JSON.parse(localStorage.getItem(TAKEN_KEY) || "[]"); return Array.isArray(v) ? v : []; }
    catch (e) { return []; }
  }
  function writeTaken(list) {
    try { if (list.length) localStorage.setItem(TAKEN_KEY, JSON.stringify(list)); else localStorage.removeItem(TAKEN_KEY); } catch (e) {}
  }
  var flushing = null;
  function flushTaken() {
    if (flushing) return flushing;
    if (!client || !user || offline) return Promise.resolve();
    flushing = readTaken().reduce(function (p, id) {
      return p.then(function () {
        return client.rpc("mark_taken", { p_id: id }).then(check).then(function () { return true; }, function (e) {
          // only these can still come right: the network, a session gone for now, a delivery not marked yet
          var m = e && e.message ? String(e.message) : "";
          return /^EN_/.test(m) && m !== "EN_NOT_DELIVERED" && m !== "EN_SIGNED_OUT";
        }).then(function (done) {
          if (done) writeTaken(readTaken().filter(function (x) { return x !== id; }));
        });
      });
    }, Promise.resolve()).catch(inboxWarn).then(function () { flushing = null; });
    return flushing;
  }
  function markTaken(rowId) {
    var list = readTaken();
    if (list.indexOf(rowId) === -1) { list.push(rowId); writeTaken(list); }
    return flushTaken();
  }
  // what the inbox says about one row, or null if it can't say inside 3 seconds
  function inboxStatus(rowId) {
    if (!client || !user || offline) return Promise.resolve(null);
    return new Promise(function (done) {
      var t = setTimeout(function () { done(null); }, 3000);
      Promise.resolve().then(function () {
        return client.from("character_inbox").select("status").eq("id", rowId).maybeSingle().then(check);
      }).then(function (row) { clearTimeout(t); done(row ? row.status : null); }, function (e) { clearTimeout(t); inboxWarn(e); done(null); });
    });
  }

  /* ---- listening ----
     A row's arrival is only a signal: what to file is read fresh, through the same path as everything
     else. A listener that came back after a gap has missed whatever happened in the gap, so being
     subscribed is a reason to read as well. */
  function onInboxEvent(ev) {
    var row = ev && ev.new ? ev.new : null;
    if (!user || !row) return;
    var mine = linkedTo(book(), row.character_id);
    if (mine && (row.status === "waiting" || row.status === "delivered" || row.status === "due" || row.status === "applied")) {
      hearTabs();   // the tab that filed this may have said so already
      /* Any mail may be the letter that says the campaign changed its Advancement Type. The campaign list is
         read again whenever mail arrives, so an open sheet follows at once, where it would otherwise wait for its next sync. */
      if (EN.campaigns && EN.campaigns.refresh) EN.campaigns.refresh();
      var ch = roster()[mine];
      if (!filed(ch, row.id)) {
        wanted[row.id] = 1;
        if (tabHidden()) waitingForView = true;
        else sync({ pull: true });
      }
    }
    // the Admin's list of sends, when it is open
    if (row.sender_id === user.id && ev.eventType === "UPDATE" && EN.gmCampaign && EN.gmCampaign.sendsChanged) EN.gmCampaign.sendsChanged(row.campaign_id);
  }
  function stopListening() {
    if (channel && channelOf && typeof channelOf.removeChannel === "function") {
      try { channelOf.removeChannel(channel); } catch (e) {}
    }
    channel = null; channelOf = null;
  }
  function listen() {
    stopListening();
    if (!client || !user || typeof client.channel !== "function") return;
    var me = user.id;
    try {
      channelOf = client;
      channel = client.channel("inbox:" + me)
        .on("postgres_changes", { event: "*", schema: "public", table: "character_inbox" }, onInboxEvent)
        .subscribe(function (state) { if (state === "SUBSCRIBED" && user && user.id === me) sync({ pull: true }); });
    } catch (e) { inboxWarn(e); }
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
      // not one already linked: a campaign pick can upload a record while this question is up
      if (!yes) ids.forEach(function (id) { if (!b.links[id]) b.localOnly[id] = 1; });
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

  /* ---- a record's row, for js/campaigns.js ------------------------------------------
     rowOf answers the row a local record is linked to, if any. ensureRow makes sure it has one: a
     record kept local uploads itself, one still waiting on the upload question stops waiting (the
     pick answered it for this record), and anything else goes up with an ordinary sync. */
  function rowOf(id) {
    if (!user) return null;
    var L = book().links[id];
    return L ? L.cid : null;
  }
  function ensureRow(id) {
    if (!client || !user) return Promise.reject(new Error("Not jacked in."));
    var b = book();
    if (b.links[id]) return Promise.resolve(b.links[id].cid);
    if (awaiting && awaiting[id]) delete awaiting[id];
    return (b.localOnly[id] ? upload([id]) : sync()).then(function () {
      var L = book().links[id];
      if (!L) throw new Error("The record did not upload.");
      return L.cid;
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
    if (!user) { stopListening(); setStatus("off"); tellUser(); return; }
    if (!loggedMeta) { loggedMeta = true; try { console.info("Discord profile fields", Object.keys(meta())); } catch (e) {} }
    if (user.id !== prev) {
      var me = user.id;
      wanted = {}; told = {}; waitingForView = false; heldMail = [];
      listen();
      holdUnclaimed();
      sync({ pull: true }).then(function () { if (user && user.id === me && awaiting) offerUpload(); });
      refreshPacks();
      tellUser();
    }
    paint();
  }
  // who is jacked in changed, or the link came back: js/campaigns.js reads the account again
  var userWatchers = [];
  function onUser(fn) { userWatchers.push(fn); }
  function tellUser() { userWatchers.forEach(function (f) { try { f(user); } catch (e) { console.error(e); } }); }
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
    tellUser();
  }
  function backOnline(u) {
    var was = offline;
    offline = false;
    user = u;
    if (was) { if (!channel) listen(); sync({ pull: true }); refreshPacks(); tellUser(); }
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
      delete b.filing[id];
      if (L) { delete b.links[id]; if (b.pendingDel.indexOf(L.cid) === -1) b.pendingDel.push(L.cid); }
      saveBook(b);
      if (L) sync();
    });
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "visible" && user && (waitingForView || Date.now() - lastPull > 30000)) {
        waitingForView = false;
        sync({ pull: true });
      }
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
    // for js/campaigns.js: the client, whose account it is, and a record's row
    client: function () { return client; },
    userId: function () { return user ? user.id : null; },
    onUser: onUser, rowOf: rowOf, ensureRow: ensureRow, appUrl: returnUrl,
    // the Admin's inbox, for js/face.js's Take it; js/campaigns.js says when the desktop is up
    markTaken: markTaken, inboxStatus: inboxStatus, landed: landed,
    // the test suite swaps in a stand-in client (no network, no Discord)
    _useClient: function (c) { start(); stopListening(); user = null; offline = false; wire(c); },
    offline: function () { return offline; }
  };
})();
