/* ===========================================================================
   ELYSIUM NIGHTS · #POST as a chat: the player's side of the database (17 Nov 2026, the chat migration).
   The Freelancer's Messages page (js/face.js, messengerPanel) reads like a messenger: each conversation is one thread,
   the GM's letters and the player's answers interleaved by when they were written, in real time. The letters the GM
   sent are on the record (ch.face.post, filed by js/cloud.js); everything else a conversation needs lives in the
   database and is kept here, in memory, for the open record's campaign:
   - what this character wrote to the GM (gm_mailbox), with when the GM read it;
   - letters between this character and the other characters in the campaign (player_mail), with when each was read;
   - when the GM's letters to this character were written (character_inbox), read only while the record holds a letter
     filed before letters carried a time (ctx.needTimes), so those still sort;
   - who the other characters in the campaign are (campaign_roster), to name a chat and to start one.
   It is read when the page asks, again when Realtime says something moved (js/cloud.js), and when it is a little old.
   A change redraws; a read that found nothing new draws nothing, so asking from every render is safe.
   Nothing here is kept on the record, and a viewed or locked sheet never gets here (face.js gmContext answers null).
   No em or en dashes anywhere in this file (house style).
   =========================================================================== */
window.EN = window.EN || {};

EN.chat = (function () {
  function C() { return EN.campaigns; }
  var FRESH_MS = 20000;     // a read this recent is good enough, unless Realtime said otherwise
  var ROSTER_MS = 300000;   // who is in the campaign changes rarely

  /* What is held for the open record: { key, row, cid, gm, pm, inbox, names, at, sig, loading, again, rosterAt, wantRoster }.
     gm: this character's letters to the GM, newest first. pm: letters to or from this character, newest first (null where
     the project does not have the table yet). inbox: { row id: { at, read } } for the GM's letters to it. names:
     { character row id: { name, player, mine } } for every character in the campaign. */
  var _s = null;
  function stateFor(ctx) {
    var key = ctx.row + "|" + ctx.campaignId;
    if (!_s || _s.key !== key) _s = { key: key, row: ctx.row, cid: ctx.campaignId, gm: [], pm: [], inbox: {}, names: {}, at: 0, sig: "", loading: false };
    return _s;
  }
  function meId() { return EN.cloud && EN.cloud.userId ? EN.cloud.userId() : null; }
  function onPost() { return EN.app && EN.app.portal() === "freelancer" && EN.app.activeTab() === "post"; }
  function sigOf(s) {
    return (s.gm || []).map(function (r) { return r.id + ":" + (r.status || "") + (r.read_at ? "r" : ""); }).join(",") + "|" +
      (s.pm === null ? "none" : (s.pm || []).map(function (r) { return r.id + (r.read_at ? "r" : ""); }).join(",")) + "|" +
      Object.keys(s.inbox).map(function (k) { return k + (s.inbox[k].read ? "r" : ""); }).join(",") + "|" + Object.keys(s.names).length;
  }

  function ensure(ctx, force) {
    if (!ctx || !C() || !C().mySentToGm) return null;
    var s = stateFor(ctx);
    s.needTimes = !!ctx.needTimes;
    if (s.loading) { if (force) s.again = true; return s; }
    if (!force && s.at && Date.now() - s.at < FRESH_MS) return s;
    var needRoster = !!s.wantRoster || !s.rosterAt || Date.now() - s.rosterAt > ROSTER_MS;
    s.wantRoster = false;
    s.loading = true;
    function soft(p, dflt) { return Promise.resolve().then(p).then(function (r) { return r; }, function (e) { console.warn("#POST could not read part of a chat", e); return dflt; }); }
    Promise.all([
      soft(function () { return C().mySentToGm(s.cid); }, s.gm),
      soft(function () { return C().playerMail ? C().playerMail(s.cid) : null; }, s.pm),
      // the GM's letters' times, only while the record has a letter without one: every letter filed since carries its own
      ctx.needTimes ? soft(function () { return C().inboxOf ? C().inboxOf(s.row) : []; }, null) : null,
      needRoster ? soft(function () { return C().roster(s.cid); }, null) : null
    ]).then(function (all) {
      if (_s !== s) return;
      s.gm = (all[0] || []).filter(function (r) { return r && r.character_id === s.row; });
      s.pm = all[1] === null ? null : (all[1] || []).filter(function (r) { return r && (r.from_character === s.row || r.to_character === s.row); });
      if (all[2]) {
        var inbox = {};
        all[2].forEach(function (r) { if (r && r.id) inbox[r.id] = { at: r.created_at || "", read: !!r.read_at }; });
        s.inbox = inbox;
      }
      if (all[3]) {
        var me = meId(), names = {};
        all[3].forEach(function (m) {
          (Array.isArray(m.characters) ? m.characters : []).forEach(function (sheet) {
            names[sheet.id] = { name: typeof sheet.name === "string" && sheet.name ? sheet.name : "Unnamed Freelancer", player: m.discord_name || "", mine: !!me && m.user_id === me };
          });
        });
        s.names = names;
        s.rosterAt = Date.now();
      }
      // a letter from a character the roster did not list (one that joined since): read the roster once more
      if (!all[3] && (s.pm || []).some(function (r) { return !s.names[r.from_character] || !s.names[r.to_character]; })) { s.wantRoster = true; s.again = true; }
      s.at = Date.now(); s.loading = false;
      var sig = sigOf(s), changed = sig !== s.sig;
      s.sig = sig;
      if (changed && onPost()) EN.app.render();
      if (s.again) { s.again = false; ensure(ctx, true); }
    });
    return s;
  }

  /* Realtime heard a row move (js/cloud.js): a letter to or from the GM, a letter between players, or a letter's read
     time. Anything touching the open record's campaign is read again. */
  function heard(ev) {
    var row = ev && ev.new ? ev.new : (ev && ev.old ? ev.old : null);
    if (!_s) return;
    if (row && row.campaign_id && row.campaign_id !== _s.cid) return;
    _s.at = 0;
    ensure({ row: _s.row, campaignId: _s.cid, needTimes: !!_s.needTimes }, true);
  }

  /* ---- reading: what the player has now seen goes up once, so the other side can say Seen ---- */
  var _told = {};
  function seen(ctx, inboxIds, pmIds) {
    if (!ctx || !C()) return;
    var s = stateFor(ctx);
    // told once per letter per session: the database keeps the first time, and a second telling would change nothing
    var gmIds = (inboxIds || []).filter(function (id) { return id && !_told[id] && !(s.inbox[id] && s.inbox[id].read); });
    var pIds = (pmIds || []).filter(function (id) { return id && !_told[id]; });
    function up(ids, call, mark) {
      if (!ids.length || !call) return;
      ids.forEach(function (id) { _told[id] = 1; });
      Promise.resolve().then(function () { return call(ids.slice(0, 200)); }).then(function () {
        ids.forEach(mark);
      }, function (e) {
        ids.forEach(function (id) { delete _told[id]; });   // tried again the next time the chat is opened
        console.warn("#POST could not say the letters were read", e);
      });
    }
    up(gmIds, C().markInboxRead, function (id) { if (s.inbox[id]) s.inbox[id].read = true; });
    up(pIds, C().markPlayerMailRead, function (id) { (s.pm || []).forEach(function (r) { if (r.id === id && !r.read_at) r.read_at = new Date().toISOString(); }); });
  }

  /* ---- writing ---- */
  function after(ctx) { return function (v) { if (_s && _s.key === ctx.row + "|" + ctx.campaignId) _s.at = 0; ensure(ctx, true); return v; }; }
  // a chat line is a message alone; a letter from Mail has a subject too
  function toGm(ctx, body, replyTo, subj) { return C().sendToGm(ctx.row, subj ? { subj: subj, body: body } : { body: body }, replyTo || null).then(after(ctx)); }
  function toPlayer(ctx, toRow, body) { return C().sendToPlayer(ctx.row, toRow, body).then(after(ctx)); }

  function data(ctx) { return ctx ? stateFor(ctx) : null; }
  function reset() { _s = null; _told = {}; }

  return { ensure: ensure, heard: heard, seen: seen, toGm: toGm, toPlayer: toPlayer, data: data, reset: reset };
})();
