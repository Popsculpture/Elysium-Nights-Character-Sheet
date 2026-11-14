/* ===========================================================================
   ELYSIUM NIGHTS · GM #POST inbox (Admin tab)
   The Admin desktop's #POST tab has three pages: INBOX (this file), WRITE and SENT (js/gm_campaign.js). The INBOX is
   the other direction of the mail: letters players write to the people who run their campaign, or answer a GM's letter
   with (the GM mailbox migration, table gm_mailbox). It lists them as THREADS, one per character and per name the
   conversation is with: a letter that answers one the GM signed as Mama Ruiz is in the thread "Vex, to Mama Ruiz",
   and a letter written to the GM outright is in "Vex, to the GM". Each thread also carries what this account sent
   to that character under that name, so a conversation reads whole. Opening a thread marks what is in it read, and
   what is unread is the rail's badge.

   It keeps nothing that lasts: the mailbox is read from the database (RLS gives the people who run a campaign every
   letter in it), kept in memory for the campaign this tab is on, and read again when Realtime says a letter came
   (js/cloud.js, its own channel), when the page is opened, and when the cache is a little old. REPLY does not draw a
   composer of its own: it points WRITE at the character, signed with the name the thread is with and a subject of
   "Re: ...", so a reply gets the same composer, the same signing and the same packages as any letter.
   =========================================================================== */
window.EN = window.EN || {};

EN.gmPost = (function () {
  var el = EN.ui.el, toast = EN.ui.toast;
  function C() { return EN.campaigns; }

  var FRESH_MS = 20000;
  /* What this tab's campaign's mailbox held when it was last read:
     { id, rows (null where the project has no mailbox yet), sends, names: { character row id: { name, player } }, at, sig, loading, again }.
     Thrown away when the tab moves to another campaign. */
  var _c = null;
  var _sel = null;   // the thread open on the page, by key
  /* Letters this tab has marked read, by id. A read of the mailbox that began before a mark landed comes back with the
     letter still unread, and a read replaces the rows it holds, so the mark is applied to whatever rows are there, now
     and on every read after, rather than to the row that was on the page when it was pressed. */
  var _marked = {};
  function applyMarked(rows) {
    (rows || []).forEach(function (r) { if (_marked[r.id] && r.status === "unread") r.status = "read"; });
    return rows;
  }

  function deskId() {
    var d = EN.gmStore && EN.gmStore.desk ? EN.gmStore.desk() : null;
    return d ? d.id : "";
  }
  function onThisPage() { return EN.app && EN.app.portal() === "admin" && EN.app.activeTab() === "gmpost" && EN.app.subTab("gmpost") === "inbox"; }
  function sigOf(rows) { return rows === null ? "none" : rows.map(function (r) { return r.id + ":" + r.status; }).join(","); }

  /* Read the mailbox for this tab's campaign, unless that was done a moment ago or is under way. A change to what the
     page or the rail shows redraws; a read that found nothing new draws nothing, so asking from every render is safe. */
  function ensure(force) {
    var id = deskId();
    if (!id || !C() || !C().gmMail || !C().enabled()) return;
    if (!_c || _c.id !== id) { _c = { id: id, rows: [], sends: [], names: {}, at: 0, sig: "", loading: false }; _sel = null; }
    if (_c.loading) { _c.again = true; return; }
    if (!force && _c.at && Date.now() - _c.at < FRESH_MS) return;
    var mine = _c;
    mine.loading = true;
    Promise.all([
      Promise.resolve().then(function () { return C().gmMail(id); }),
      Promise.resolve().then(function () { return C().sends(id); }).then(function (r) { return r || []; }, function () { return []; }),
      Promise.resolve().then(function () { return C().roster(id); }).then(function (r) { return r || []; }, function () { return []; })
    ]).then(function (all) {
      if (_c !== mine) return;
      var names = {};
      all[2].forEach(function (m) {
        (Array.isArray(m.characters) ? m.characters : []).forEach(function (sheet) {
          names[sheet.id] = { name: typeof sheet.name === "string" && sheet.name ? sheet.name : "Unnamed Freelancer", player: m.discord_name || "" };
        });
      });
      applyMarked(all[0]);
      var sig = sigOf(all[0]) + "|" + (all[1] || []).length + "|" + Object.keys(names).length;
      var changed = sig !== mine.sig;
      mine.rows = all[0]; mine.sends = all[1]; mine.names = names; mine.at = Date.now(); mine.sig = sig; mine.loading = false;
      if (changed && EN.app && EN.app.portal() === "admin") EN.app.render();
      if (mine.again) { mine.again = false; ensure(true); }
    }, function (e) {
      console.warn("Could not read the mailbox", e);
      if (_c === mine) { mine.loading = false; mine.at = Date.now(); }
    });
  }

  // the rail's badge: letters not read yet, in this tab's campaign
  function unread() {
    ensure(false);
    if (!_c || _c.id !== deskId() || !_c.rows) return 0;
    return _c.rows.filter(function (r) { return r.status === "unread"; }).length;
  }

  /* Realtime heard a letter (js/cloud.js), or the channel came up and may have missed some: read again. The campaign
     this tab is on is the only one that matters here; a letter in another is read when that tab is opened. */
  function heard(ev) {
    var row = ev && ev.new ? ev.new : null;
    if (row && _c && row.campaign_id && row.campaign_id !== _c.id) return;
    if (!C() || !C().running || !C().running().length) return;
    if (_c) _c.at = 0;
    ensure(true);
  }

  /* ---- the threads ---- */
  function nameOf(charId) { return (_c && _c.names[charId]) || { name: "A character no longer here", player: "" }; }
  function threads() {
    var by = {};
    function slot(charId, persona) {
      var k = charId + "|" + (persona || "");
      return by[k] || (by[k] = { key: k, charId: charId, persona: persona || "", msgs: [] });
    }
    (_c.rows || []).forEach(function (r) {
      var m = r.mail || {};
      slot(r.character_id, r.persona).msgs.push({ dir: "in", at: r.created_at, subj: m.subj || "", body: m.body || "", row: r });
    });
    // what this account sent under that name goes into a conversation that has begun, and does not begin one
    (_c.sends || []).forEach(function (s) {
      var m = s.mail || {}, k = s.character_id + "|" + (m.from || "");
      if (by[k] && s.status !== "recalled") by[k].msgs.push({ dir: "out", at: s.created_at, subj: m.subj || "", body: m.body || "", from: m.from || "" });
    });
    var list = Object.keys(by).map(function (k) {
      var t = by[k];
      t.msgs.sort(function (a, b) { return a.at < b.at ? -1 : a.at > b.at ? 1 : 0; });
      t.last = t.msgs[t.msgs.length - 1];
      t.unread = t.msgs.filter(function (m) { return m.dir === "in" && m.row.status === "unread"; }).length;
      return t;
    });
    list.sort(function (a, b) { return a.last.at < b.last.at ? 1 : a.last.at > b.last.at ? -1 : 0; });
    return list;
  }
  function threadTitle(t) { return nameOf(t.charId).name + ", to " + (t.persona || "the GM"); }
  function when(iso) {
    var d = new Date(iso);
    return isNaN(d.getTime()) ? "" : d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) + " " + d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  }

  // opening a thread reads what is in it: the database first, then the page
  function readThread(t) {
    t.msgs.forEach(function (m) {
      if (m.dir !== "in" || m.row.status !== "unread") return;
      var row = m.row;
      C().markGmRead(row.id).then(function () {
        _marked[row.id] = true;
        row.status = "read";
        if (_c) {
          applyMarked(_c.rows);
          _c.sig = sigOf(_c.rows) + "|" + (_c.sends || []).length + "|" + Object.keys(_c.names).length;
        }
        if (EN.app && EN.app.portal() === "admin") EN.app.render();
      }, function (e) { console.warn("Could not mark a letter read", e); toast(C().errText(e)); });
    });
  }

  function threadRow(t) {
    var open = _sel === t.key;
    var who = nameOf(t.charId);
    return el("div", { dataset: { thread: t.key, unread: t.unread ? "1" : "0" }, role: "button", tabindex: "0",
      style: { display: "flex", gap: "8px", alignItems: "flex-start", padding: "8px 10px", cursor: "pointer", borderBottom: "1px solid var(--border)",
               background: open ? "var(--bg3)" : "transparent" },
      onclick: function () { _sel = t.key; EN.app.render(); readThread(t); },
      onkeydown: function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); this.click(); } } }, [
      el("span.post-dot", { style: { background: t.unread ? "var(--gold)" : "transparent", border: t.unread ? "0" : "1px solid var(--border)", marginTop: "5px", flex: "none" } }),
      el("div", { style: { minWidth: 0, flex: "1 1 auto" } }, [
        el("div", { style: { fontWeight: t.unread ? "700" : "500" }, text: threadTitle(t) + (who.player ? " (" + who.player + ")" : "") }),
        el("div.dim3", { style: { fontSize: "12px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
          text: (t.last.dir === "out" ? "You: " : "") + (t.last.subj || t.last.body || "(no subject)") }),
        el("div.mono.dim3", { style: { fontSize: "10px" }, text: when(t.last.at) + (t.unread ? " · " + t.unread + " NEW" : "") })
      ])
    ]);
  }

  function conversation(t) {
    var msgs = t.msgs.map(function (m) {
      var inn = m.dir === "in";
      return el("div", { dataset: { msg: m.dir }, style: { padding: "8px 10px", borderBottom: "1px solid var(--border)", borderLeft: "3px solid " + (inn ? "var(--gold)" : "var(--border2)") } }, [
        el("div.mono.dim3", { style: { fontSize: "10px", letterSpacing: ".1em" }, text: (inn ? nameOf(t.charId).name.toUpperCase() : "YOU AS " + String(m.from || "").toUpperCase()) + " · " + when(m.at) }),
        m.subj ? el("div", { style: { fontWeight: "600", margin: "2px 0" }, text: m.subj }) : null,
        // text, never markup: a player's words reach the page as text
        m.body ? el("div", { style: { whiteSpace: "pre-wrap" }, text: m.body }) : null
      ]);
    });
    var lastIn = t.msgs.filter(function (m) { return m.dir === "in"; }).pop();
    var subj = lastIn && lastIn.subj ? (/^re:/i.test(lastIn.subj) ? lastIn.subj : "Re: " + lastIn.subj) : "";
    var reply = el("div", { style: { padding: "8px 10px" } }, [
      el("button.btn.sm.primary", { type: "button", dataset: { post: "reply" }, title: "Write back, signed as " + (t.persona || "the GM"),
        onclick: function () {
          if (EN.gmCampaign && EN.gmCampaign.draftTo) EN.gmCampaign.draftTo(t.charId, { from: t.persona || "The GM", subj: subj });
        } }, "REPLY AS " + (t.persona || "THE GM").toUpperCase())
    ]);
    return EN.ui.panel(threadTitle(t), String(t.msgs.length), msgs.concat([reply]));
  }

  /* The INBOX page, drawn under Sysop-style chips by the #POST tab (js/app.js). */
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
    ensure(_c && _c.id === id && _c.at && Date.now() - _c.at > 4000);
    if (!_c || _c.id !== id || !_c.at) {
      mount.appendChild(el("div.muted-box", { style: { padding: "26px" }, text: "Reading the mailbox…" }));
      return true;
    }
    if (_c.rows === null) {
      mount.appendChild(el("div.muted-box", { dataset: { post: "none" }, style: { padding: "26px" }, text: "Player mail is not open on this project yet. Letters you send still reach your players." }));
      return true;
    }
    var list = threads();
    var bar = el("div.row.wrap", { style: { gap: "8px", alignItems: "center", margin: "0 0 10px" } }, [
      el("button.btn.sm", { type: "button", dataset: { post: "refresh" }, title: "Read the mailbox again", onclick: function () { ensure(true); } }, "↻ REFRESH"),
      el("span.help", { style: { margin: 0 }, dataset: { post: "count" }, text: list.length ? list.length + (list.length === 1 ? " THREAD" : " THREADS") + " · " + unread() + " UNREAD" : "" })
    ]);
    if (!list.length) {
      mount.appendChild(el("div", null, [bar, el("div.muted-box", { dataset: { post: "empty" }, style: { padding: "26px" },
        text: "No letters from your players yet. They write to you from their own #POST, or answer a letter you sent." })]));
      return true;
    }
    if (!_sel || !list.some(function (t) { return t.key === _sel; })) _sel = null;
    var open = list.filter(function (t) { return t.key === _sel; })[0] || null;
    var left = el("div", { dataset: { post: "threads" }, style: { flex: "1 1 260px", minWidth: "0", border: "1px solid var(--border)", alignSelf: "flex-start" } }, list.map(threadRow));
    var right = el("div", { style: { flex: "2 1 340px", minWidth: "0" } }, [open ? conversation(open) : el("div.muted-box", { style: { padding: "26px" }, text: "Pick a thread." })]);
    mount.appendChild(el("div", null, [bar, el("div.row.wrap", { style: { gap: "12px", alignItems: "flex-start" } }, [left, right])]));
    return true;
  }

  function reset() { _c = null; _sel = null; _marked = {}; }

  return { renderInbox: renderInbox, unread: unread, heard: heard, ensure: ensure, reset: reset, threads: function () { return _c && _c.rows ? threads() : []; } };
})();
