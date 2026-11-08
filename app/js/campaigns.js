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
  var STASH = "en_join_v1", CACHE = "en_campaigns_v1", PICK = "en_campaign_pick_v1";

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
    EN_TOO_LATE: "Too late to recall. It's been delivered."
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
  function sends(id) {
    return client().from("character_inbox").select("id, character_id, mail, status, created_at")
      .eq("campaign_id", id).eq("sender_id", me()).order("created_at", { ascending: false }).limit(50).then(check);
  }

  // the Campaign tab's picker, remembered per device
  function pick() { return getKey(PICK) || ""; }
  function setPick(id) { setKey(PICK, id); }

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

  /* ---- start ------------------------------------------------------------------- */
  function start() {
    var c = cloud();
    if (c && c.onUser) c.onUser(function () {
      mem = null;
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
    sendToCharacter: sendToCharacter, sendToCrew: sendToCrew, recallSend: recallSend, sends: sends
  };
})();
