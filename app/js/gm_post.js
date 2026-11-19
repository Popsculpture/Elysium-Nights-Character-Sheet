/* ===========================================================================
   ELYSIUM NIGHTS · GM #POST chats (Admin tab)
   The Admin desktop's #POST tab has three pages: CHATS (this file), WRITE and SENT (js/gm_campaign.js). CHATS is the GM's
   side of the conversation, drawn the way a messenger draws it (17 Nov 2026, the author's call), as the Freelancer's
   Messages page is (js/face.js): the conversations down the left, the most recent first, and the one picked on the right,
   everything said both ways in the order it was written, newest at the bottom, with the message box under it. Enter sends.

   A CONVERSATION is one character and one voice: the GM writes as NPCs ("Mama Ruiz") as well as as themself, and a
   player answers whoever wrote, so "Vex, with Mama Ruiz" and "Vex, with The GM" are two chats, as they are two on the
   player's side. The voice is matched without regard to case, and a letter written to the GM outright is in the GM's
   own chat ("The GM"). What the player wrote is the GM mailbox (table gm_mailbox); what this account sent them under
   that name is the inbox (character_inbox), and a send starts a chat as well as a player's letter does. The notices the
   app signs (Campaign, Payroll, XP Award, Milestones) are not chats: SENT lists them.

   SEEN, both ways: opening a chat marks the player's letters read (mark_gm_mail_read), and the player's app marks the
   GM's letters read when they open theirs (the chat migration's read_at), which shows here under the last thing the GM
   said. Letters with a subject or a package are still written on MAIL (the sub-tab once called WRITE); a chat's line goes as a message alone.

   It keeps nothing that lasts: all of it is read from the database (RLS gives the people who run a campaign every letter
   in its mailbox, and each account its own sends), kept in memory for the campaign this tab is on, and read again when
   Realtime says something moved (js/cloud.js), when the page is opened, and when the cache is a little old.
   No em or en dashes anywhere in this file (house style).
   =========================================================================== */
window.EN = window.EN || {};

EN.gmPost = (function () {
  var el = EN.ui.el, toast = EN.ui.toast;
  function C() { return EN.campaigns; }

  var FRESH_MS = 20000;
  /* Who the characters are changes rarely (a player joins, a sheet is renamed), and the roster is a round trip of its
     own, so it is read once per campaign and again only on REFRESH, when a letter comes from a character it did not
     list, or after this long. The mailbox and the sends are what move, and are read each time. */
  var ROSTER_MS = 300000;
  /* What this tab's campaign's mailbox held when it was last read:
     { id, rows (null where the project has no mailbox yet), sends, names: { character row id: { name, player } }, at, sig, loading, again }.
     Thrown away when the tab moves to another campaign. */
  var _c = null;
  var _sel = null;   // the chat open on the page, by key
  /* The page's own state, kept across redraws: the search, All or Unread, what is being typed in each chat, a send under
     way, a new chat being started (pending, picking), and whether the thread should go to its newest line. */
  var _ui = { q: "", only: "all", drafts: {}, busy: {}, pending: null, picking: false, pickChar: "", pickAs: "", stick: false };
  /* Letters this tab has marked read, by id. A read of the mailbox that began before a mark landed comes back with the
     letter still unread, and a read replaces the rows it holds, so the mark is applied to whatever rows are there, now
     and on every read after, rather than to the row that was on the page when it was pressed. */
  var _marked = {};
  function applyMarked(rows) {
    (rows || []).forEach(function (r) { if (_marked[r.id] && r.status === "unread") r.status = "read"; });
    return rows;
  }
  var SYSTEM = { "campaign": 1, "payroll": 1, "xp award": 1, "milestones": 1 };
  var GM_NAMES = { "the gm": 1, "your gm": 1, "gm": 1 };
  function voiceKey(name) { var k = String(name || "").trim().toLowerCase(); return !k || GM_NAMES[k] ? "the gm" : k; }

  function deskId() {
    var d = EN.gmStore && EN.gmStore.desk ? EN.gmStore.desk() : null;
    return d ? d.id : "";
  }
  function onThisPage() { return EN.app && EN.app.portal() === "admin" && EN.app.activeTab() === "gmpost" && EN.app.subTab("gmpost") === "inbox"; }
  function unreadIn(rows) { return (rows || []).filter(function (r) { return r.status === "unread"; }).length; }
  function sigOf(rows) { return rows === null ? "none" : rows.map(function (r) { return r.id + ":" + r.status; }).join(","); }
  function sendsSig(sends) { return (sends || []).map(function (s) { return s.id + ":" + s.status + (s.read_at ? "r" : ""); }).join(","); }

  /* Read the mailbox for this tab's campaign, unless that was done a moment ago or is under way. A change to what the
     page or the rail shows redraws; a read that found nothing new draws nothing, so asking from every render is safe.
     `force` skips the cache; `withRoster` reads who the characters are as well (see ROSTER_MS). */
  function ensure(force, withRoster) {
    var id = deskId();
    if (!id || !C() || !C().gmMail || !C().enabled()) return;
    if (!_c || _c.id !== id) { _c = { id: id, rows: [], sends: [], names: {}, at: 0, sig: "", loading: false }; _sel = null; }
    if (_c.loading) { _c.again = true; return; }
    if (!force && _c.at && Date.now() - _c.at < FRESH_MS) return;
    var mine = _c;
    var needRoster = !!withRoster || mine.wantRoster || !mine.rosterAt || Date.now() - mine.rosterAt > ROSTER_MS;
    mine.wantRoster = false;
    mine.loading = true;
    Promise.all([
      Promise.resolve().then(function () { return C().gmMail(id); }),
      Promise.resolve().then(function () { return C().sends(id); }).then(function (r) { return r || []; }, function () { return []; }),
      needRoster ? Promise.resolve().then(function () { return C().roster(id); }).then(function (r) { return r || []; }, function () { return []; }) : null
    ]).then(function (all) {
      if (_c !== mine) return;
      var names = mine.names;
      if (all[2]) {
        names = {};
        all[2].forEach(function (m) {
          (Array.isArray(m.characters) ? m.characters : []).forEach(function (sheet) {
            names[sheet.id] = { name: typeof sheet.name === "string" && sheet.name ? sheet.name : "Unnamed Freelancer", player: m.discord_name || "" };
          });
        });
        mine.rosterAt = Date.now();
      }
      applyMarked(all[0]);
      var sig = sigOf(all[0]) + "|" + sendsSig(all[1]) + "|" + Object.keys(names).length;
      var changed = sig !== mine.sig, badge = unreadIn(mine.rows) !== unreadIn(all[0]);
      mine.rows = all[0]; mine.sends = all[1]; mine.names = names; mine.at = Date.now(); mine.sig = sig; mine.loading = false; mine.read = true;
      // a letter from a character the roster did not list (a sheet that joined since): read the roster once more
      if (!all[2] && (all[0] || []).some(function (r) { return !names[r.character_id]; })) { mine.wantRoster = true; mine.again = true; }
      /* Redrawn only where it shows: on CHATS, or for the rail's badge. A send moving along (delivered, Seen) must not redraw
         WRITE under a GM who is in the middle of a letter. */
      if (changed && (onThisPage() || (badge && EN.app && EN.app.portal() === "admin"))) EN.app.render();
      if (mine.again) { mine.again = false; ensure(true); }
    }, function (e) {
      console.warn("Could not read the mailbox", e);
      if (_c === mine) { mine.loading = false; mine.at = Date.now(); mine.read = true; }
    });
  }

  // the rail's badge: letters not read yet, in this tab's campaign
  function unread() {
    ensure(false);
    if (!_c || _c.id !== deskId() || !_c.rows) return 0;
    return _c.rows.filter(function (r) { return r.status === "unread"; }).length;
  }

  /* Realtime heard a letter, a send delivered or read, or the channel came up and may have missed some: read again. The
     campaign this tab is on is the only one that matters here; a letter in another is read when that tab is opened. */
  function heard(ev) {
    var row = ev && ev.new ? ev.new : null;
    if (row && _c && row.campaign_id && row.campaign_id !== _c.id) return;
    if (!C() || !C().running || !C().running().length) return;
    ensure(true);   // forced: the cache is skipped, and what is on the page stays until the read lands
  }

  /* ---- the chats ---- */
  function nameOf(charId) { return (_c && _c.names[charId]) || { name: "A character no longer here", player: "" }; }
  function timeOf(iso) { var t = iso ? Date.parse(iso) : NaN; return isNaN(t) ? 0 : t; }
  function threads() {
    var by = {};
    function slot(charId, voice) {
      var k = charId + "|" + voiceKey(voice);
      return by[k] || (by[k] = { key: k, charId: charId, voice: voiceKey(voice) === "the gm" ? "The GM" : String(voice).trim(), items: [], unread: 0 });
    }
    (_c.rows || []).forEach(function (r) {
      var m = r.mail || {};
      var t = slot(r.character_id, r.persona);
      t.items.push({ dir: "in", at: timeOf(r.created_at), subj: m.subj || "", body: m.body || "", row: r });
      if (r.status === "unread") t.unread++;
    });
    // what this account sent under a voice is that chat's other half, and starts one; the app's own notices are not chats
    (_c.sends || []).forEach(function (s) {
      var m = s.mail || {};
      if (s.status === "recalled" || SYSTEM[String(m.from || "").trim().toLowerCase()]) return;
      var t = slot(s.character_id, m.from);
      // the voice as this account last wrote it, which is how the next line is signed
      if (voiceKey(m.from) !== "the gm") t.voice = String(m.from).trim();
      t.items.push({ dir: "out", at: timeOf(s.created_at), subj: m.subj || "", body: m.body || "", pkg: Array.isArray(m.package) ? m.package : null, send: s });
    });
    var list = Object.keys(by).map(function (k) {
      var t = by[k];
      t.items.sort(function (a, b) { return a.at - b.at; });
      t.last = t.items[t.items.length - 1];
      return t;
    });
    list.sort(function (a, b) { return b.last.at - a.last.at; });
    return list;
  }
  function chatTitle(t) { return nameOf(t.charId).name + (t.voice === "The GM" ? "" : ", with " + t.voice); }
  function initialsOf(n) { return String(n || "?").replace(/["'#]/g, "").split(/\s+/).filter(Boolean).map(function (w) { return w.charAt(0); }).join("").slice(0, 2).toUpperCase() || "?"; }
  // a time to read: today's as a clock, this week's with the day, older with the date
  function stamp(ms) {
    var d = new Date(ms), now = new Date();
    if (!ms || isNaN(d.getTime())) return "";
    var clock = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
    if (d.toDateString() === now.toDateString()) return clock;
    if (now - d < 6 * 864e5) return d.toLocaleDateString(undefined, { weekday: "short" }) + " " + clock;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) + " " + clock;
  }

  /* Opening a chat reads what is in it: the database first, then the page, once for the whole chat however many letters
     it holds, and one refusal is said once. */
  function readThread(t) {
    var rows = t.items.filter(function (m) { return m.dir === "in" && m.row.status === "unread" && !_marked[m.row.id + ":asking"]; }).map(function (m) { return m.row; });
    if (!rows.length) return;
    rows.forEach(function (row) { _marked[row.id + ":asking"] = true; });
    var refused = null;
    Promise.all(rows.map(function (row) {
      return C().markGmRead(row.id).then(function () { return row; }, function (e) { refused = e; return null; });
    })).then(function (done) {
      rows.forEach(function (row) { delete _marked[row.id + ":asking"]; });
      done.forEach(function (row) { if (row) { _marked[row.id] = true; row.status = "read"; } });
      if (_c) {
        applyMarked(_c.rows);
        _c.sig = sigOf(_c.rows) + "|" + sendsSig(_c.sends) + "|" + Object.keys(_c.names).length;
      }
      if (refused) { console.warn("Could not mark a letter read", refused); toast(C().errText(refused)); }
      if (EN.app && EN.app.portal() === "admin") EN.app.render();
    });
  }
  function openChat(t) { _sel = t.key; _ui.stick = true; _ui.picking = false; EN.app.render(); readThread(t); }

  function chatRow(t, open) {
    var last = t.last, line = last ? (last.dir === "out" ? "You: " : "") + (last.body || last.subj || (last.pkg ? "A package" : "")) : "";
    return el("button.msgr-th" + (open ? ".on" : "") + (t.unread ? ".un" : ""), { type: "button", "aria-pressed": open ? "true" : "false",
      dataset: { thread: t.key, post: "chat", unread: t.unread ? "1" : "0" }, title: nameOf(t.charId).player ? "Played by " + nameOf(t.charId).player : "",
      onclick: function () { openChat(t); } }, [
      el("span.msgr-av.pc", { text: initialsOf(nameOf(t.charId).name) }),
      el("span.msgr-tt", null, [el("b", { text: chatTitle(t) }), el("span", { text: line + (last ? "  ·  " + stamp(last.at) : "") })]),
      t.unread ? el("i.msgr-ud", { title: t.unread + " unread", text: String(t.unread) }) : null]);
  }

  function said(t, it) {
    var kids = [];
    if (it.subj) kids.push(el("b.msgr-s", { text: it.subj }));
    // text, never markup: a player's words reach the page as text
    if (it.body) kids.push(el("p.msgr-t", { text: it.body }));
    if (it.pkg && it.pkg.length) kids.push(el("p.msgr-t.dim", { text: "Package: " + it.pkg.map(function (p) { return p.name + " ×" + p.qty; }).join(", ") }));
    if (!kids.length) kids.push(el("p.msgr-t.dim", { text: "(empty)" }));
    return el("div.msgr-m" + (it.dir === "out" ? ".me" : it.row.status === "unread" ? ".new" : ""), { dataset: { msg: it.dir, id: it.dir === "out" ? it.send.id : it.row.id } }, [el("div.msgr-b", null, kids)]);
  }
  function statusOf(it) {
    var s = it.send;
    if (s.read_at) return "Seen";
    if (s.status === "delivered" || s.status === "taken" || s.status === "applied") return "Delivered";
    return "Sent";
  }

  // the message box: a line to the player, signed with the chat's voice. Enter sends; Shift and Enter is a new line.
  function compose(t) {
    var key = t.key, busy = !!_ui.busy[key];
    var box = el("textarea", { maxlength: "4000", rows: 1, value: _ui.drafts[key] || "", placeholder: "Message " + nameOf(t.charId).name + " as " + t.voice, "aria-label": "Message",
      dataset: { post: "gm-chat-body" },
      oninput: function (e) { _ui.drafts[key] = e.target.value; },
      onkeydown: function (e) { if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); send(); } } });
    function send() {
      var body = String(_ui.drafts[key] || "").trim();
      if (!body || _ui.busy[key]) { if (!body) toast("Write something first."); return; }
      _ui.busy[key] = true; _ui.stick = true;
      Promise.resolve().then(function () { return C().sendToCharacter(t.charId, { from: t.voice, body: body }); }).then(function () {
        delete _ui.busy[key]; _ui.drafts[key] = ""; _ui.stick = true;
        if (_ui.pending && _ui.pending.key === key) _ui.pending = null;
        ensure(true);
        EN.app.render();
        var again = document.querySelector('#view [data-post="gm-chat-body"]'); if (again) { try { again.focus({ preventScroll: true }); } catch (e) {} }
      }, function (e) {
        delete _ui.busy[key];
        console.warn("Could not send", e);
        toast(C().errText(e));
        EN.app.render();
      });
    }
    return el("div.msgr-cmp", { dataset: { post: "gm-chat-compose" } }, [
      el("div.msgr-cmp-row", null, [box,
        el("button.btn.primary", { type: "button", disabled: busy, dataset: { post: "gm-chat-send" }, title: "It goes to " + nameOf(t.charId).name + ", signed " + t.voice, onclick: send }, busy ? "…" : "SEND")]),
      el("div.msgr-cmp-x", null, [el("button.btn.sm.ghost", { type: "button", dataset: { post: "reply" }, title: "A letter with a subject or a package, on MAIL",
        onclick: function () { if (EN.gmCampaign && EN.gmCampaign.draftTo) EN.gmCampaign.draftTo(t.charId, { from: t.voice, subj: "" }); } }, "LETTER WITH A PACKAGE ›")])]);
  }

  function conversation(t) {
    var feed = el("div.msgr-feed", { dataset: { keepScroll: "gm-chat-feed" } }), lastAt = 0, lastOut = null;
    t.items.forEach(function (it) { if (it.dir === "out") lastOut = it; });
    t.items.forEach(function (it) {
      if (it.at && (!lastAt || it.at - lastAt > 15 * 60000 || new Date(it.at).toDateString() !== new Date(lastAt).toDateString())) feed.appendChild(el("div.msgr-when", { text: stamp(it.at) }));
      if (it.at) lastAt = it.at;
      feed.appendChild(said(t, it));
      if (it === lastOut) { var st = statusOf(it); feed.appendChild(el("div.msgr-seen", { dataset: { post: "seen", seen: st === "Seen" ? "1" : "0" }, text: st })); }
    });
    if (!t.items.length) feed.appendChild(el("p.msgr-empty", { text: "Nothing yet. What you write here reaches " + nameOf(t.charId).name + "'s #POST, signed " + t.voice + "." }));
    var who = nameOf(t.charId);
    var head = el("div.msgr-h", null, [
      el("button.btn.sm.ghost.msgr-back", { type: "button", dataset: { post: "back" }, title: "Back to the chats", onclick: function () { _sel = null; EN.app.render(); } }, "‹"),
      el("span.msgr-av.pc", { text: initialsOf(who.name) }),
      el("span.msgr-hn", null, [el("b", { text: who.name }), el("small", { text: (who.player ? "Played by " + who.player + "  ·  " : "") + "you write as " + t.voice })]),
      el("span", { style: { flex: "1 1 auto" } }),
      el("span.chip", { dataset: { post: "voice" }, text: "AS " + t.voice.toUpperCase() })]);
    return [head, feed, compose(t)];
  }

  // starting a chat: whom, and as whom
  function picker(list) {
    var ids = Object.keys(_c.names).sort(function (a, b) { return _c.names[a].name.localeCompare(_c.names[b].name); });
    /* Who the GM can write as (18 Nov 2026, the author's list): The GM, ??? (nobody says who), the People cards, and the
       campaign's own characters, so a line can come as if another player wrote it (their app puts it in the chat with that
       player). Then the names already used in a chat. Typed names work too. Left blank, it is The GM. */
    var voices = [], seen = {};
    function add(v, label) { v = String(v || "").trim(); if (!v || seen[v.toLowerCase()]) return; seen[v.toLowerCase()] = 1; voices.push([v, label || ""]); }
    add("The GM", "Yourself");
    add("???", "Nobody says who");
    (EN.gmStore && EN.gmStore.list ? EN.gmStore.list("contacts") : []).map(function (c) { return c && c.name; }).filter(Boolean).sort(function (a, b) { return a.localeCompare(b); })
      .forEach(function (n) { add(n, "People"); });
    ids.forEach(function (id) { add(_c.names[id].name, "A player's character" + (_c.names[id].player ? " (" + _c.names[id].player + ")" : "")); });
    list.forEach(function (t) { add(t.voice, "Used in a chat"); });
    var dl = el("datalist#gm-chat-voices", null, voices.map(function (v) { return el("option", { value: v[0], label: v[1] }); }));
    var as = el("input", { type: "text", maxlength: "80", value: _ui.pickAs, list: "gm-chat-voices", placeholder: "The GM, ???, a contact, or a player", "aria-label": "Write as", dataset: { post: "pick-as" },
      oninput: function (e) { _ui.pickAs = e.target.value; } });
    var rows = ids.map(function (id) {
      var n = _c.names[id];
      return el("button.msgr-th" + (_ui.pickChar === id ? ".on" : ""), { type: "button", dataset: { post: "pick", pick: id }, onclick: function () {
        var voice = String(_ui.pickAs || "").trim() || "The GM";
        if (voice.length > 80) { toast("A name is 80 characters at most."); return; }
        var key = id + "|" + voiceKey(voice), have = list.filter(function (t) { return t.key === key; })[0];
        _ui.picking = false; _ui.pickAs = "";
        if (have) { openChat(have); return; }
        _ui.pending = { key: key, charId: id, voice: voiceKey(voice) === "the gm" ? "The GM" : voice, items: [], unread: 0 };
        _sel = key; _ui.stick = true; EN.app.render();
      } }, [el("span.msgr-av.pc", { text: initialsOf(n.name) }), el("span.msgr-tt", null, [el("b", { text: n.name }), el("span", { text: n.player ? "Played by " + n.player : "" })])]);
    });
    if (!rows.length) rows.push(el("p.msgr-empty", { text: "No characters in this campaign yet." }));
    return el("div.msgr-list.msgr-pickl", { dataset: { post: "picker" } }, [
      el("div.msgr-sb", null, [el("label.fl", { style: { margin: "0 0 2px" }, text: "Write as" }), as, dl]),
      el("p.msgr-foot", { style: { borderTop: "0" }, text: "Left blank, it is The GM. Then pick who to write to." })].concat(rows));
  }

  /* The CHATS page, drawn under the #POST tab's sub-tab chips (js/app.js). */
  function renderInbox(mount) {
    EN.ui.clear(mount);
    var id = deskId();
    if (!C() || !C().enabled()) {
      mount.appendChild(el("div.muted-box", { dataset: { post: "off" }, style: { padding: "26px" }, text: "Jack in to read your players' mail." }));
      return true;
    }
    if (!id) {
      mount.appendChild(el("div.muted-box", { dataset: { post: "nopick" }, style: { padding: "26px" }, text: "No campaign picked. Pick one in the top bar to read its mail." }));
      return true;
    }
    ensure(false);
    // the first read only: a read again keeps the page as it is until it lands
    if (!_c || _c.id !== id || !_c.read) {
      mount.appendChild(el("div.muted-box", { style: { padding: "26px" }, text: "Reading the mailbox…" }));
      return true;
    }
    if (_c.rows === null) {
      mount.appendChild(el("div.muted-box", { dataset: { post: "none" }, style: { padding: "26px" }, text: "Player mail is not open on this project yet. Letters you send still reach your players." }));
      return true;
    }
    var list = threads(), n = unread();
    var open = list.filter(function (t) { return t.key === _sel; })[0] || null;
    if (!open && _ui.pending && _ui.pending.key === _sel) open = _ui.pending;
    if (!open) _sel = null;
    // what arrives in the chat that is open is read as it comes, once the page is drawn
    if (open && open.unread) setTimeout(function () { if (_sel === open.key) readThread(open); }, 0);

    var listBox = el("div.msgr-list", { dataset: { keepScroll: "gm-chat-list", post: "threads" } });
    function fill() {
      var q = _ui.q.trim().toLowerCase();
      var shown = list.filter(function (t) {
        if (_ui.only === "unread" && !t.unread) return false;
        if (!q) return true;
        return chatTitle(t).toLowerCase().indexOf(q) !== -1 || nameOf(t.charId).player.toLowerCase().indexOf(q) !== -1 ||
          t.items.some(function (it) { return (it.subj + " " + it.body).toLowerCase().indexOf(q) !== -1; });
      });
      EN.ui.clear(listBox);
      if (!shown.length) listBox.appendChild(el("p.msgr-empty", { dataset: { post: "empty" }, text: list.length ? "No chat matches."
        : "No chats yet. Start one with + NEW CHAT, or wait for a player to write from their own #POST." }));
      shown.forEach(function (t) { listBox.appendChild(chatRow(t, !!open && open.key === t.key)); });
    }
    fill();
    var chips = ["all", "unread"].map(function (k) {
      return el("button.msgr-chip" + (_ui.only === k ? ".on" : ""), { type: "button", dataset: { post: "only-" + k }, onclick: function () {
        _ui.only = k; chips.forEach(function (c) { c.classList.toggle("on", c.getAttribute("data-post") === "only-" + k); }); fill(); } }, k === "all" ? "All" : "Unread" + (n ? " · " + n : ""));
    });
    var side = el("div.msgr-side", null, [
      el("div.msgr-sh", null, [el("h3", { text: _ui.picking ? "New chat" : "Chats" }), el("span", { style: { flex: "1 1 auto" } }),
        _ui.picking ? el("button.btn.sm.ghost", { type: "button", dataset: { post: "pick-cancel" }, onclick: function () { _ui.picking = false; EN.app.render(); } }, "CANCEL")
          : el("button.btn.sm", { type: "button", dataset: { post: "new-chat" }, title: "Write to a character, as the GM or as anyone", onclick: function () { _ui.picking = true; ensure(true, true); EN.app.render(); } }, "+ NEW CHAT"),
        _ui.picking ? null : el("button.btn.sm.ghost", { type: "button", dataset: { post: "refresh" }, title: "Read the mailbox again", onclick: function () { ensure(true, true); } }, "↻")]),
      _ui.picking ? null : el("div.msgr-sb", null, [el("input", { type: "text", value: _ui.q, placeholder: "Search chats", "aria-label": "Search chats", dataset: { post: "search" },
        oninput: function (e) { _ui.q = e.target.value; fill(); } })]),
      _ui.picking ? null : el("div.msgr-chips", null, chips),
      _ui.picking ? picker(list) : listBox,
      el("p.msgr-foot", { dataset: { post: "count" }, text: list.length ? list.length + (list.length === 1 ? " chat" : " chats") + (n ? " · " + n + " unread" : "") : "Chats are with one character and one voice." })]);
    var main = el("div.msgr-main", { dataset: { thread: open ? open.key : "" } }, open ? conversation(open)
      : [el("p.msgr-empty.msgr-pick", { dataset: { post: "nopick-chat" }, text: list.length ? "Select a chat to read it." : "Your players' letters, and what you say back, show here." })]);
    mount.appendChild(el("div.msgr-sub", null, [el("div.msgr.gm", { dataset: { post: "gm-messenger", pane: open ? "thread" : "list" } }, [side, main])]));
    if (_ui.stick) {
      _ui.stick = false;
      var go = function () { var f = mount.querySelector(".msgr-feed"); if (f) f.scrollTop = f.scrollHeight; };
      go(); setTimeout(go, 0);
    }
    return true;
  }

  function reset() { _c = null; _sel = null; _marked = {}; _ui.pending = null; _ui.picking = false; }

  return { renderInbox: renderInbox, unread: unread, heard: heard, ensure: ensure, reset: reset, threads: function () { return _c && _c.rows ? threads() : []; } };
})();
