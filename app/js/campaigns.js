/* =========================================================================
   #GRID OS · campaigns.js
   The player's side of campaigns (campaigns batch 2, the author, 7 Nov 2026).
   The database owns every rule (supabase/migrations/*_campaigns.sql): this file
   asks it things and remembers the answers. A hidden button is for clarity, not
   safety.

   THE JOIN LINK. An invite is the app's address with ?join=<token>. The token is
   stashed in localStorage (en_join_v1) as this file loads, which is why this is
   the first script on the page: cloud.js's returnUrl() strips the query string,
   so the round trip through Discord would lose it otherwise. The query is then
   taken off the address, so a reload does not ask again.

   ON ARRIVAL. The login card first if it is due (gate.js), then the join card,
   which needs a Discord session: Run offline on a join link explains that and
   offers Jack in. app.js says when the app has landed.

   WHAT IS REMEMBERED. en_campaigns_v1 holds, per account, the campaigns the
   account is in with its role in each, and which of its rows sits in which
   campaign: { <user id>: { list: [{ id, name, role, joined_at }], rows: { <row id>:
   <campaign id> } } }. It is account state, like cloud.js's link book, so it never
   rides a record or an export: a record's campaign is characters.campaign_id, and
   that column is not in `data`. Keeping it on the device is what lets the fence in
   app.js (Gizmo says no) answer at boot, before the network has. It is re-read on
   jack-in, on every pull, and after any roster change made here.

   IT FAILS QUIETLY. These reads run beside the character sync and never inside
   it. A failure, a table that is not there yet included, costs the campaign
   list and nothing else.
   ES5 throughout, like the rest of the app. Names and sheets here are other
   people's words: they go into the page as text, never as HTML.
   ========================================================================= */
window.EN = window.EN || {};

EN.campaigns = (function () {
  "use strict";
  var STASH = "en_join_v1", CACHE = "en_campaigns_v1", PICK = "en_campaign_pick_v1", PICK_TAB = "en_campaign_pick_tab_v1", ASKED = "en_gm_asked_v1";

  function getKey(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function setKey(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function dropKey(k) { try { localStorage.removeItem(k); } catch (e) {} }

  (function stashInvite() {
    try {
      var m = /[?&]join=([^&#]*)/.exec(location.search);
      if (!m) return;
      var token = decodeURIComponent(m[1]);
      if (token) setKey(STASH, token);
      var rest = location.search.replace(/([?&])join=[^&#]*(&?)/, function (all, lead, tail) { return tail ? lead : ""; });
      history.replaceState(null, "", location.pathname + rest + location.hash);   // refused on some file:// pages, and that is fine
    } catch (e) {}
  })();

  function cloud() { return EN.cloud; }
  function client() { var c = cloud(); return c && c.client ? c.client() : null; }
  function el() { return EN.ui.el.apply(null, arguments); }
  function me() {
    var c = cloud(), id = c && c.userId ? c.userId() : null;
    if (id) return id;
    // at boot, before the client has answered: the stored session, read the way js/packs.js reads it
    var s = EN.packs && EN.packs.storedSession ? EN.packs.storedSession() : null;
    return s && s.user && s.user.id ? String(s.user.id) : null;
  }
  // jacked in, so a pick can reach the account
  function enabled() { var c = cloud(); return !!(c && c.signedIn && c.signedIn()); }
  function check(res) {
    if (res && res.error) throw res.error;
    return res ? res.data : null;
  }

  /* ---- what is remembered ------------------------------------------------- */
  var EMPTY = { uid: null, list: [], rows: {} };
  var mem = null;
  function readAll() {
    try { var v = JSON.parse(getKey(CACHE) || "null"); return v && typeof v === "object" ? v : {}; }
    catch (e) { return {}; }
  }
  function data() {
    var id = me();
    if (!id) return EMPTY;
    if (!mem || mem.uid !== id) {
      var d = readAll()[id] || {};
      mem = { uid: id, list: Array.isArray(d.list) ? d.list : [], rows: d.rows && typeof d.rows === "object" ? d.rows : {} };
    }
    return mem;
  }
  function save() {
    if (!mem || !mem.uid) return;
    var all = readAll();
    all[mem.uid] = { list: mem.list, rows: mem.rows };
    setKey(CACHE, JSON.stringify(all));
  }

  function list() { return data().list.slice(); }
  function find(id) { return data().list.filter(function (c) { return c.id === id; })[0] || null; }
  function runs(c) { return c.role === "admin" || c.role === "coadmin"; }
  function running() { return data().list.filter(runs); }

  /* GIZMO SAYS NO. An account that is crew in at least one campaign and runs none gets his ACCESS
     DENIED page instead of the Admin desktop: this answers with the campaign to name, or null for
     everyone else (no campaigns, offline, or running any campaign). It is a polite fence, like the
     old passphrase: it stops nobody who means it, since jacking out or creating a campaign of their
     own gets past it, and it guards nothing the database has not already refused. */
  function crewOn() {
    var l = data().list;
    if (!l.length || l.some(runs)) return null;
    return l[0].name;
  }

  /* ---- a local record's campaign ------------------------------------------ */
  var pending = {};   // local id -> the campaign a pick is on its way to, so a redraw shows the pick
  function recordCampaign(lid) {
    if (Object.prototype.hasOwnProperty.call(pending, lid)) return pending[lid];
    var c = cloud(), row = c && c.rowOf ? c.rowOf(lid) : null;
    return row ? (data().rows[row] || null) : null;
  }
  function recordCampaignName(lid) {
    var id = recordCampaign(lid), c = id ? find(id) : null;
    return c ? c.name : "";
  }
  /* The pick goes straight to the row, never through `data`, the moment it is made. A local-only
     record uploads itself the first time. A failure puts the dropdown back and says so. */
  function setRecord(lid, campaignId) {
    var c = cloud(), to = campaignId || null;
    pending[lid] = to;
    return c.ensureRow(lid).then(function (row) {
      return client().from("characters").update({ campaign_id: to }).eq("id", row).select("id").then(check)
        .then(function (rows) {
          if (!rows || !rows.length) throw new Error("The row is gone.");
          delete pending[lid];
          var d = data();
          if (to) d.rows[row] = to; else delete d.rows[row];
          save();
          crewStale();
          if (EN.app) EN.app.render();
        });
    }).catch(function (e) {
      delete pending[lid];
      console.warn("Could not save the campaign", e);
      EN.ui.toast(errText(e, "Could not save that. It stays where it was."));
      if (EN.app) EN.app.render();
    });
  }

  /* ---- reading it fresh ---------------------------------------------------- */
  var running_ = null, again = false, lastRead = 0;
  function refresh() {
    var c = client(), id = c && enabled() ? me() : null;
    if (!id || (cloud().offline && cloud().offline())) return Promise.resolve(false);
    if (running_) { again = true; return running_; }
    lastRead = Date.now();
    running_ = Promise.all([
      c.from("campaign_members").select("campaign_id, role, joined_at").eq("user_id", id).then(check),
      c.from("campaigns").select("id, name").then(check),
      c.from("characters").select("id, campaign_id").eq("owner_id", id).then(check)
    ]).then(function (all) {
      if (me() !== id) return false;
      var names = {}, rows = {};
      (all[1] || []).forEach(function (x) { names[x.id] = x.name; });
      (all[2] || []).forEach(function (x) { if (x.campaign_id) rows[x.id] = x.campaign_id; });
      var next = (all[0] || []).map(function (m) {
        return { id: m.campaign_id, name: names[m.campaign_id] || "Unnamed campaign", role: m.role, joined_at: m.joined_at };
      }).sort(function (a, b) { return a.joined_at < b.joined_at ? -1 : a.joined_at > b.joined_at ? 1 : 0; });
      var d = data(), changed = JSON.stringify(d.list) !== JSON.stringify(next) || JSON.stringify(d.rows) !== JSON.stringify(rows);
      d.list = next; d.rows = rows;
      if (changed) { save(); repaint(); }
      return changed;
    }).catch(function (e) {
      console.warn("Campaigns could not be read", e);
      return false;
    }).then(function (r) {
      running_ = null;
      if (again) { again = false; return refresh(); }
      return r;
    });
    return running_;
  }
  // an attempt on the Admin desktop asks again, unless someone just did
  function refreshSoon() { if (Date.now() - lastRead > 5000) refresh(); }
  function repaint() {
    if (!EN.app) return;
    if (EN.gmCampaign && EN.gmCampaign.invalidate) EN.gmCampaign.invalidate();   // a change was seen: the tab reads again
    crewStale();
    if (EN.gate && EN.gate.deniedOpen && EN.gate.deniedOpen() && !crewOn()) {
      EN.gate.closeDenied();   // made co-Admin since the last read: they get in
      EN.app.setPortal("admin");
      return;
    }
    if (EN.app.portal() === "admin") { EN.app.setPortal("admin"); return; }   // the fence reads the new roles
    EN.app.render();
  }

  /* ---- what the database refuses, in words ----------------------------------- */
  var WORDS = {
    EN_SIGNED_OUT: "Jack in first.",
    EN_NOT_ALLOWED: "You can't do that in this campaign.",
    EN_BAD_NAME: "A campaign name is 1 to 80 characters.",
    EN_DEAD_INVITE: "This invite link doesn't work anymore. Ask your Admin for a new one.",
    EN_BLOCKED: "You can't join this campaign.",
    EN_NOT_MEMBER: "They aren't in this campaign anymore.",
    EN_ADMIN_LOCKED: "The Admin has to transfer leadership first.",
    EN_ADMIN_ONLY: "Only the Admin can do that.",
    EN_BAD_ROLE: "That role isn't one of the choices.",
    EN_BAD_MAIL: "A message needs a From, and a subject, a message or a package.",
    EN_TOO_LATE: "Too late to recall that one."
  };
  function code(e) {
    var m = e && e.message ? String(e.message) : "";
    return Object.prototype.hasOwnProperty.call(WORDS, m) ? m : "";
  }
  function errText(e, fallback) {
    var k = code(e);
    return k ? WORDS[k] : (fallback || "Could not reach your account. Try again in a moment.");
  }
  function rpc(name, args) {
    var c = client();
    if (!c) return Promise.reject(new Error("No cloud link."));
    return c.rpc(name, args).then(check);
  }

  /* ---- the functions ----------------------------------------------------------
     Reads for the Campaign tab (js/gm_campaign.js), and the writes. A write that changes who is
     in what re-reads the list, so the fence and the dropdowns follow at once. */
  function afterRoster(v) { return refresh().then(function () { return v; }); }
  function create(name) { return rpc("create_campaign", { p_name: name }).then(afterRoster); }
  function leave(id) { return rpc("leave_campaign", { p_campaign: id }).then(afterRoster); }
  function roster(id) { return rpc("campaign_roster", { p_campaign: id }); }
  function blocked(id) { return rpc("campaign_blocked", { p_campaign: id }); }
  function invite(id) {
    return client().from("campaign_invites").select("token").eq("campaign_id", id).maybeSingle().then(check)
      .then(function (row) { return row ? row.token : ""; });
  }
  function resetInvite(id) { return rpc("reset_invite", { p_campaign: id }); }
  function removeMember(id, user, block) { return rpc("remove_member", { p_campaign: id, p_user: user, p_block: !!block }).then(afterRoster); }
  function unblock(id, user) { return rpc("unblock_member", { p_campaign: id, p_user: user }); }
  function setRole(id, user, role) { return rpc("set_role", { p_campaign: id, p_user: user, p_role: role }).then(afterRoster); }
  function transfer(id, user) { return rpc("transfer_leadership", { p_campaign: id, p_user: user }).then(afterRoster); }
  function rename(id, name) { return rpc("rename_campaign", { p_campaign: id, p_name: name }).then(afterRoster); }
  function remove(id) { return rpc("delete_campaign", { p_campaign: id }).then(afterRoster); }
  function inviteUrl(token) { return cloud().appUrl() + "?join=" + encodeURIComponent(token); }

  /* #POST from the Admin (batch 3). The sends list asks by sender_id and by campaign: the read policy
     also answers with mail sent to this account's own characters, which is not what this list is. */
  function sendToCharacter(rowId, mail) { return rpc("send_to_character", { p_character: rowId, p_mail: mail }); }
  function sendToCrew(id, mail) { return rpc("send_to_crew", { p_campaign: id, p_mail: mail }); }
  function recallSend(id) { return rpc("recall_send", { p_id: id }); }
  // the Admin desktop's writing tabs, for EN.gmStore's far door: safe to repeat with the same key
  // `sender` is the account the app means to send as: the database refuses EN_NOT_MINE if the session changed under it
  function sendWrite(rowId, key, mail, ops, sender) { return rpc("send_write", { p_character: rowId, p_key: key, p_mail: mail, p_ops: ops || null, p_sender: sender || null }); }
  // UNDO of a send_write: answers "cancelled", "recalled" or "corrected" (the migration says what each means)
  function takeBack(rowId, key, mail, sender) { return rpc("take_back", { p_character: rowId, p_key: key, p_mail: mail, p_sender: sender || null }); }
  function sends(id) {
    return client().from("character_inbox").select("id, character_id, mail, status, created_at")
      .eq("campaign_id", id).eq("sender_id", me()).order("created_at", { ascending: false }).limit(50).then(check);
  }

  /* THE PICK. Which campaign this tab is on, and with it which Admin desktop (js/gmstore.js follow). Each
     tab keeps its own, in memory and across a reload, as it keeps its own character (store.js): an Admin
     can have one campaign open in each of two tabs. A new tab starts on the last one picked anywhere. Once
     a tab has an answer it doesn't change unless this tab changes it. NO_CAMPAIGN is a pick too: this
     browser's own desktop and crew, which is what an account with no campaign gets anyway. */
  var NO_CAMPAIGN = "none";
  var tabPick = null;
  function pinTab() { try { sessionStorage.setItem(PICK_TAB, tabPick); } catch (e) {} }
  function pick() {
    if (tabPick === null) {
      var own = null;
      try { own = sessionStorage.getItem(PICK_TAB); } catch (e) {}
      tabPick = own || getKey(PICK) || "";
      if (tabPick) pinTab();   // a reload comes back here, whatever another tab picks next
    }
    return tabPick;
  }
  function setPick(id) {
    tabPick = id || "";
    setKey(PICK, tabPick);
    pinTab();
    if (EN.gmStore && EN.gmStore.follow) EN.gmStore.follow();   // the desktop never lags the pick, so a write can't land on the one just left
  }
  /* The campaign this tab's Admin desktop belongs to, or null. This answers from what is remembered, with
     no network in it, unlike current() below: a dropped connection must not swap the Table out from under a
     fight, and at boot it has to answer before the client has. Only jacking out, for real, leaves it. */
  function desktop() {
    var mine = running();
    if (!mine.length) return null;
    var want = pick();
    if (want === NO_CAMPAIGN) return null;
    var hit = mine.filter(function (x) { return x.id === want; })[0];
    if (hit) return hit;
    /* A tab with no pick pins this answer. The first in the list can change under a tab, when the account is made
       co-Admin on an older campaign, and that must not swap the Table. It stays this tab's own: a new tab still
       opens on the last one someone picked. A pick this account can't reach stays as it is, since it may be
       another account's on this browser, and that account will want it back. */
    if (!want) { tabPick = mine[0].id; pinTab(); }
    return mine[0];
  }

  /* ---- what the device held from before a campaign had its own desktop -----------
     Asked once per account, on this browser, the first time it reaches the Admin desktop while running a
     campaign and en_gm_v1 holds more than the library. Nothing moves without an answer, and the answer can
     be changed later: Settings' GM data section offers the same move. An account with nothing to move is
     marked as asked, so a one-shot on the device later on never brings the card up. */
  var moveOpen = false;
  function askedMove(id) {
    try { var v = JSON.parse(getKey(ASKED) || "{}"); return !!(v && v[id]); } catch (e) { return false; }
  }
  function noteAsked(id) {
    var v = {};
    try { v = JSON.parse(getKey(ASKED) || "{}") || {}; } catch (e) { v = {}; }
    v[id] = true;
    setKey(ASKED, JSON.stringify(v));
  }
  // what a move did, in words, for the card and for Settings
  function moveWords(res) {
    if (!res.ok) return "NOT MOVED. This device refused the write, and nothing changed.";
    if (!res.moved && !res.stayed && !res.tableStayed) return "Nothing is left on the device to move.";
    var out = res.moved ? "Moved to this campaign." : "Nothing moved.";
    if (res.tableStayed) out += " This campaign's Table is in use, so the old one stayed on the device.";
    if (res.stayed) out += " " + res.stayed + (res.stayed === 1 ? " thing" : " things") + " stayed on the device, where the same record already differs here or another campaign owns the row.";
    if (res.copied) out += " The device copy could not be cleared, so it is still there too.";
    return out;
  }
  /* Moves the device's work into campaign `id` and lands this tab on it. */
  function moveInto(id) {
    var now = desktop();
    if (!now || now.id !== id) setPick(id);
    // a device refusing the last edit keeps the tab where it was (js/gmstore.js follow), and the work mustn't land there instead
    var at = EN.gmStore.desk();
    if (!at || at.id !== id) return { ok: false, why: "refused" };
    return EN.gmStore.moveDevice();
  }
  function checkMove() {
    var who = me();
    if (moveOpen || !who || !landedYet || cardOpen || !enabled() || !(EN.gate && EN.gate.panel) || !EN.gmStore || !EN.gmStore.deviceHolds) return;
    if (!EN.app || EN.app.portal() !== "admin" || askedMove(who)) return;
    var mine = running();
    if (!mine.length) return;
    var held = EN.gmStore.deviceHolds();
    if (!held) { noteAsked(who); return; }
    moveOpen = true;
    var p = null;
    function done(words) {
      noteAsked(who);
      moveOpen = false;
      p.close();
      if (EN.app) EN.app.render();
      if (words) EN.ui.toast(words);
    }
    function card(note) {
      var o = {
        warn: "ADMIN DESKTOP",
        label: "Admin work on this device",
        lines: [
          "Each campaign has its own Admin desktop now. This device holds work from before that: " + EN.gmStore.countText(held) + ".",
          "Saved Threats and custom Hazards stay shared either way. Which campaign does the rest belong to?"
        ].concat(note ? [note] : []),
        actions: mine.map(function (c) {
          return { label: "MOVE TO " + c.name.toUpperCase(), key: "move-" + c.id, onClick: function () {
            var res = moveInto(c.id);
            // refused: the question still stands, and the answer isn't this one
            if (!res.ok) { card(moveWords(res)); return; }
            done(moveWords(res));
          } };
        }).concat([
          { label: "LEAVE IT ON THIS DEVICE", key: "move-leave", onClick: function () { done("It stays on this device. Pick \"No campaign\" in the Table's picker to open it, and Settings can move it later."); } }
        ])
      };
      if (p) p.show(o); else p = EN.gate.panel(o);
    }
    card();
  }

  /* ---- + New campaign, drawn by Manage characters and the Campaign tab alike -----
     It keeps its own state, so a redraw in the middle of typing a name loses nothing. */
  var formOpen = false, formDraft = "";
  function newForm() {
    var box = el("div.camp-new");
    function shut() { formOpen = false; formDraft = ""; draw(); }
    function submit() {
      var name = formDraft.trim();
      if (!name) { EN.ui.toast(WORDS.EN_BAD_NAME); return; }
      create(name).then(function () {
        shut();
        EN.ui.toast(EN.app && EN.app.portal() === "admin" ? "Campaign created." : "Campaign created. Your invite link is on the Admin desktop's Campaign tab.");
        if (EN.app) EN.app.render();
      }, function (e) { console.warn("Could not create the campaign", e); EN.ui.toast(errText(e)); });
    }
    function draw() {
      EN.ui.clear(box);
      if (!formOpen) {
        box.appendChild(el("button.btn.sm.primary", { type: "button", "data-camp": "new",
          onclick: function () { formOpen = true; draw(); var i = box.querySelector("input"); if (i) i.focus(); } }, "+ NEW CAMPAIGN"));
        return;
      }
      box.appendChild(el("input.camp-input", { type: "text", maxlength: "80", value: formDraft, placeholder: "Campaign name", "aria-label": "Campaign name", "data-camp": "new-name",
        oninput: function (e) { formDraft = e.target.value; },
        onkeydown: function (e) { if (e.key === "Enter") submit(); } }));
      box.appendChild(el("button.btn.sm.primary", { type: "button", "data-camp": "new-go", onclick: submit }, "CREATE"));
      box.appendChild(el("button.btn.sm", { type: "button", onclick: shut }, "CANCEL"));
    }
    draw();
    return box;
  }

  /* ---- the join card ------------------------------------------------------------ */
  var landedYet = false, cardOpen = false, waitTimer = null;
  function pendingJoin() { return getKey(STASH) || ""; }
  function clearJoin() { dropKey(STASH); }
  function returning() { try { return /[?&]code=/.test(location.search); } catch (e) { return false; } }

  function checkJoin() {
    var token = pendingJoin();
    if (!token || !landedYet || cardOpen || !(EN.gate && EN.gate.panel)) return;
    clearTimeout(waitTimer);
    if (enabled()) { previewCard(token); return; }
    /* A stored session, or the way back from Discord: the client is still answering, and the
       account will call back here through onUser. If it never does, say what is needed. */
    if (client() && (me() || returning())) { waitTimer = setTimeout(function () { if (!enabled()) offlineCard(); }, 6000); return; }
    offlineCard();
  }
  function closeCard(p) { cardOpen = false; p.close(); }
  function offlineCard() {
    cardOpen = true;
    var online = !!(cloud() && cloud().available && cloud().available()), p = null;
    function jack() {
      p.busy("OPENING DISCORD…");
      /* A redirect leaves the page, and the stash is what comes back with it. If the page is still
         here a few seconds after the request settled, Discord could not be reached (cloud.js has
         toasted it): the card is usable again. */
      Promise.resolve(cloud().jackIn("discord")).then(function () {
        setTimeout(function () { if (cardOpen) draw("Could not reach Discord. Try again in a moment."); }, 4000);
      });
    }
    function draw(note) {
      var o = {
        warn: "CAMPAIGN INVITE",
        label: "Campaign invite",
        lines: online
          ? ["You followed an invite to a campaign. Joining needs a Discord session, so your place at the table stays with your account."]
          : ["You followed an invite to a campaign. Joining needs a Discord session.", "Discord sign-in needs the hosted app, elysiumnightsrpg.com/app."],
        actions: online
          ? [{ label: "JACK IN", key: "jack", onClick: jack },
             { label: "Not now", key: "later", onClick: function () { clearJoin(); closeCard(p); } }]
          : [{ label: "OK", key: "later", onClick: function () { clearJoin(); closeCard(p); } }]
      };
      if (note) o.lines = o.lines.concat([note]);
      if (p) p.show(o); else p = EN.gate.panel(o);
    }
    draw();
  }
  function deadCard(p, text) {
    clearJoin();
    p.show({ warn: "CAMPAIGN INVITE", lines: [text], actions: [{ label: "OK", key: "ok", onClick: function () { closeCard(p); } }] });
  }
  function previewCard(token) {
    cardOpen = true;
    var p = EN.gate.panel({ warn: "CAMPAIGN INVITE", label: "Campaign invite", lines: ["Checking the invite…"], actions: [] });
    function ask() {
      rpc("invite_preview", { p_token: token }).then(function (rows) {
        var row = rows && rows.length ? rows[0] : null;
        if (!row) { deadCard(p, WORDS.EN_DEAD_INVITE); return; }
        p.show({
          warn: "CAMPAIGN INVITE",
          lines: ["Join " + row.campaign_name + "? Run by " + row.admin_name + "."],
          actions: [
            { label: "JOIN", key: "join", onClick: function () { join(row.campaign_name); } },
            { label: "Not now", key: "later", onClick: function () { clearJoin(); closeCard(p); } }
          ]
        });
      }, retry);
    }
    function retry(e) {
      console.warn("Could not read the invite", e);
      if (code(e) === "EN_DEAD_INVITE") { deadCard(p, WORDS.EN_DEAD_INVITE); return; }
      p.show({
        warn: "CAMPAIGN INVITE",
        lines: ["Could not reach your account. The invite is still good."],
        actions: [
          { label: "TRY AGAIN", key: "retry", onClick: function () { p.show({ warn: "CAMPAIGN INVITE", lines: ["Checking the invite…"], actions: [] }); ask(); } },
          { label: "Not now", key: "later", onClick: function () { clearJoin(); closeCard(p); } }
        ]
      });
    }
    function join(name) {
      p.busy("JOINING…");
      rpc("join_campaign", { p_token: token }).then(function () {
        clearJoin();
        closeCard(p);
        EN.app.setPortal("freelancer");
        if (EN.builder && EN.builder.openManager) EN.builder.openManager("You're in " + name + ". Pick a character below.");
        refresh();
      }, function (e) {
        var k = code(e);
        if (k === "EN_DEAD_INVITE" || k === "EN_BLOCKED") { deadCard(p, WORDS[k]); return; }
        retry(e);
      });
    }
    ask();
  }

  /* ---- View sheet ---------------------------------------------------------------
     The row comes through the read policy and goes to store.setViewing: in memory, never in the
     roster, never saved, never pushed. Back restores whichever Freelancer was active. */
  function fetchSheet(rowId) {
    return client().from("characters").select("id, data, updated_at").eq("id", rowId).maybeSingle().then(check);
  }
  function show(row, info, silent) {
    if (!EN.store.setViewing(row.data, { rowId: row.id, player: info.player, campaign: info.campaign, at: row.updated_at }, silent)) throw new Error("That sheet could not be read.");
  }
  function viewSheet(rowId, player, campaignId) {
    return fetchSheet(rowId).then(function (row) {
      if (!row) { EN.ui.toast("That sheet isn't in this campaign anymore."); return false; }
      show(row, { player: player, campaign: campaignId }, true);
      EN.app.gotoTab("combat");
      return true;
    }, function (e) { console.warn("Could not read the sheet", e); EN.ui.toast(errText(e)); return false; });
  }
  function refreshView() {
    var info = EN.store.viewingInfo();
    if (!info) return Promise.resolve(false);
    return fetchSheet(info.rowId).then(function (row) {
      if (!row) { EN.ui.toast("That sheet isn't in this campaign anymore."); backToCampaign(); return false; }
      show(row, info, false);
      EN.ui.toast("Sheet refreshed.");
      return true;
    }, function (e) { console.warn("Could not refresh the sheet", e); EN.ui.toast(errText(e)); return false; });
  }
  function backToCampaign() {
    EN.store.clearViewing();
    if (EN.gmCampaign && EN.gmCampaign.stale) EN.gmCampaign.stale();
    EN.app.gotoTab("campaign");
  }

  /* ---- THE CREW, for the Admin desktop ---------------------------------------------
     While an account runs a campaign, the Admin desktop's crew is that campaign's characters and
     nobody else (js/gmengine.js crew(), the Table's Pull in the crew). A bank of characters on this
     browser stays out of it, and so do the Admin's own until they are put in the campaign like
     anybody's. With no campaign to run, not jacked in or offline, current() answers null and the
     desktop goes on using this browser's records, so a table run on one device works as it always did.

     Other players' sheets come through the read policy, the same read as View sheet, as copies that
     are stripped and flagged (store.sheetCopy) and never enter the roster, so nothing can write to
     them or push them. This read has no owner filter on purpose: it asks by campaign, and those rows
     are the point. Any read of characters for "my characters" still has to filter on owner_id.
     The account's own character is the live record on this device when there is one, so Vigor can
     still clear on it. Another player's row has the id "row:<row id>", which is what tells
     js/gmstore.js not to prune it for being missing from the roster. */
  var crewCache = {};       // campaign id -> { at, loading, error, rows, sig }
  var CREW_STALE = 30000;
  function current() {
    var c = cloud();
    if (!enabled() || (c && c.offline && c.offline())) return null;
    return desktop();
  }
  function localFor(rowId) {
    var c = cloud(), r = EN.store.roster() || {}, hit = null;
    Object.keys(r).forEach(function (k) { if (c.rowOf(k) === rowId) hit = k; });
    return hit;
  }
  function sheetName(ch) {
    var n = ((ch.firstName || "") + " " + (ch.lastName || "")).trim();
    return n || (typeof ch.name === "string" && ch.name.trim()) || "Freelancer";
  }
  function shownOf(ch) {
    try { var d = EN.engine.derive(ch); return [d.caliber, d.vitalityMax]; } catch (e) { return null; }
  }
  function readCrew(id) {
    var old = crewCache[id], slot = crewCache[id] = { at: Date.now(), loading: true, error: !!(old && old.error), rows: old ? old.rows : null, sig: old ? old.sig : "" };
    var uid = me();
    Promise.resolve().then(function () {
      return Promise.all([
        rpc("campaign_roster", { p_campaign: id }),
        client().from("characters").select("id, owner_id, data, updated_at").eq("campaign_id", id).then(check)
      ]);
    }).then(function (all) {
      if (crewCache[id] !== slot) return;
      var who = {};
      (all[0] || []).forEach(function (m) { who[m.user_id] = m.discord_name || "Freelancer"; });
      var rows = (all[1] || []).map(function (r) {
        // somebody else's row: one that won't read costs that row, not the whole list
        try {
          var lid = r.owner_id === uid ? localFor(r.id) : null;
          var ch = lid ? EN.store.roster()[lid] : EN.store.sheetCopy(r.data, r.id);
          if (!ch) return null;
          return { charId: lid || "row:" + r.id, rowId: r.id, ch: ch, name: sheetName(ch), player: who[r.owner_id] || "Freelancer" };
        } catch (e) { console.warn("A campaign's sheet could not be read", r.id, e); return null; }
      }).filter(Boolean).sort(function (a, b) {
        return a.player < b.player ? -1 : a.player > b.player ? 1 : a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
      });
      // redraw for what a row or the picker shows, not for every save a player makes
      var sig = JSON.stringify(rows.map(function (r) { return [r.charId, r.name, r.player, shownOf(r.ch)]; }));
      var moved = !slot.rows || slot.error || slot.sig !== sig;
      slot.loading = false; slot.error = false; slot.rows = rows; slot.sig = sig; slot.at = slot.stale ? 0 : Date.now();
      if (moved) repaintCrew();
    }).catch(function (e) {
      if (crewCache[id] !== slot) return;
      console.warn("Could not read the campaign's crew", e);
      var first = !slot.error;
      slot.loading = false; slot.error = true; slot.at = slot.stale ? 0 : Date.now();
      if (first) repaintCrew();
    });
    return slot;
  }
  function repaintCrew() {
    if (EN.app && EN.app.portal && EN.app.portal() === "admin" && EN.app.activeTab() !== "campaign") EN.app.render();
  }
  // what is known of a campaign's crew: asking starts a read if there is none, or the last is old
  function crew(id, force) {
    var slot = crewCache[id];
    if (!slot || force || (!slot.loading && Date.now() - slot.at > CREW_STALE)) slot = readCrew(id);
    return slot;
  }
  // one Table row's sheet and player, from whichever campaign it was read in
  function crewRow(charId) {
    var C = current(), hit = null;
    function look(id) {
      ((crewCache[id] && crewCache[id].rows) || []).forEach(function (r) {
        // a row pulled before its sheet reached this device keeps the id it was pulled with
        if (!hit && (r.charId === charId || "row:" + r.rowId === charId)) hit = r;
      });
    }
    if (C) look(C.id);
    Object.keys(crewCache).forEach(look);
    return hit;
  }
  // something changed who is in a campaign: read again at the next draw, showing the old list until then
  function crewStale() {
    Object.keys(crewCache).forEach(function (id) { crewCache[id].at = 0; crewCache[id].stale = true; });   // a read under way started too soon to count
  }

  /* ---- start ------------------------------------------------------------------- */
  function start() {
    var c = cloud();
    if (c && c.onUser) c.onUser(function () {
      mem = null;
      crewCache = {};
      if (EN.gmCampaign && EN.gmCampaign.stale) EN.gmCampaign.stale();   // another account's roster does not stay on the page
      refresh();
      checkJoin();
      if (EN.app) EN.app.render();
    });
  }
  // app.js, once the login card is out of the way and the desktop is up
  function landed() {
    landedYet = true;
    checkJoin();
    checkMove();
    if (cloud() && cloud().landed) cloud().landed();   // mail that came during the boot can show now
  }

  return {
    start: start, landed: landed, enabled: enabled, refresh: refresh, refreshSoon: refreshSoon,
    list: list, find: find, running: running, crewOn: crewOn, pick: pick, setPick: setPick,
    recordCampaign: recordCampaign, recordCampaignName: recordCampaignName, setRecord: setRecord,
    pendingJoin: pendingJoin, newForm: newForm, errText: errText,
    create: create, leave: leave, roster: roster, blocked: blocked, invite: invite, resetInvite: resetInvite,
    removeMember: removeMember, unblock: unblock, setRole: setRole, transfer: transfer, rename: rename, remove: remove,
    inviteUrl: inviteUrl, viewSheet: viewSheet, refreshView: refreshView, backToCampaign: backToCampaign,
    sendToCharacter: sendToCharacter, sendToCrew: sendToCrew, recallSend: recallSend, sendWrite: sendWrite, takeBack: takeBack, sends: sends,
    current: current, crew: crew, crewRow: crewRow,
    // which Admin desktop this tab is on, and the device's work from before each campaign had one
    desktop: desktop, NO_CAMPAIGN: NO_CAMPAIGN, checkMove: checkMove, moveInto: moveInto, moveWords: moveWords
  };
})();
