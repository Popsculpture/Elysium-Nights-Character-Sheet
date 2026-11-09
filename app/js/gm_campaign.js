/* ===========================================================================
   ELYSIUM NIGHTS · GM Campaign (Admin tab)
   Running a campaign from the Admin desktop: the invite link, the roster, who is
   blocked, each player's sheet, and the campaign's settings. Everything it knows
   comes from the database through js/campaigns.js, and it keeps nothing of its own
   except where the page is.

   Who can do what. The Admin does everything. A co-Admin can view sheets, copy or
   reset the link, remove players, and block or unblock. Only the Admin removes
   co-Admins, makes or unmakes them, transfers leadership, renames or deletes. Every
   one of those rules is enforced by the functions and policies in
   supabase/migrations/*_campaigns.sql: the hidden buttons here are for clarity,
   not safety, and a refusal from the database reaches the Admin as a toast.

   A campaign the account only plays in is not listed: this tab is for tables it runs.
   Names here are other people's words, so they reach the page as text, never as HTML.

   #POST from the Admin (batch 3). The Admin and co-Admins can send in-game mail to one character
   or the whole crew, signed as an NPC card from the People tab or any typed name, with items from
   the gear catalog attached. A message can go alone, and so can a package. The list below it shows
   this account's own sends: the read policy gives them to the sender and the character's owner,
   and nobody else. It is the player's app that files a message on the record (js/cloud.js).
   =========================================================================== */
window.EN = window.EN || {};

EN.gmCampaign = (function () {
  var el = EN.ui.el, toast = EN.ui.toast;
  function C() { return EN.campaigns; }

  /* Transient: what the open campaign holds, and which confirm is up. Thrown away with the tab. */
  var _d = {};            // campaign id -> { loading, roster, token, blocked, error }
  var _remove = null;     // { user, block }: the Remove confirm that is open
  var _typed = null;      // { kind: "delete" | "transfer", to, toName }: the typed confirm that is open
  var _renameDraft = null, _transferTo = "";
  var _for = null;        // the campaign those were opened on

  /* The message being written: { uid, campaign, to, from, subj, body, pkg: [{ name, qty }], search }.
     `to` is a character's row id or "crew". It lasts until it is sent or cancelled, the way a People
     card lasts in its editor, so a look at a sheet in the middle of writing costs nothing. Only
     another account, or another campaign, ends it. */
  var _send = null;
  var _sendsHost = null;  // the Sends list's own node, so a status change never redraws what is being typed
  var MAX_ITEMS = 20, MAX_QTY = 99, RESULTS = 12;

  function stale() { _d = {}; _remove = null; _typed = null; _renameDraft = null; _transferTo = ""; }
  // what the campaign holds is out of date, but a confirm that is open stays open
  function invalidate() { _d = {}; }

  function load(id) {
    var slot = _d[id] = { loading: true };
    var runs = C();
    // the sends are beside the rest: a failure there costs that list and nothing else
    var sends = Promise.resolve().then(function () { return runs.sends(id); })
      .then(function (rows) { return rows || []; }, function (e) { console.warn("Could not read your sends", e); return null; });
    Promise.all([runs.roster(id), runs.invite(id), runs.blocked(id), sends]).then(function (all) {
      if (_d[id] !== slot) return;
      _d[id] = { roster: all[0] || [], token: all[1] || "", blocked: all[2] || [], sends: all[3] };
      repaint();
      if (slot.again) sendsChanged(id);
    }, function (e) {
      if (_d[id] !== slot) return;
      console.warn("Could not read the campaign", e);
      _d[id] = { error: runs.errText(e) };
      repaint();
      // refused, most likely because the role on this device is out of date: Try again would never
      // work, so read the role now. A change comes back through EN.campaigns' repaint.
      runs.refresh();
    });
    return slot;
  }
  function repaint() { if (EN.app.activeTab() === "campaign" && EN.app.portal() === "admin") EN.app.render(); }

  // a change went through, or was refused: either way the page shows what the database now holds
  function act(id, p, okText) {
    return p.then(function () {
      if (okText) toast(okText);
      delete _d[id];
      repaint();
    }, function (e) {
      console.warn("A campaign change failed", e);
      toast(C().errText(e));
      delete _d[id];
      repaint();
    });
  }

  function heading() {
    return el("div.row.between.wrap", { style: { marginBottom: "14px" } }, [
      el("h1", { style: { fontSize: "22px", letterSpacing: ".06em" },
        html: 'CAMPAIGN <span class="dim3" style="font-size:13px">// players, invites, sheets</span>' })
    ]);
  }

  function copyLink(url, field) {
    var answered = false;
    function say(text) { if (!answered) { answered = true; toast(text); } }
    function done() { say("Invite link copied."); }
    function failed() { say("Could not copy it. The link is in the box."); }
    // the old way first: it answers at once, where the newer one can sit waiting on a permission
    var copied = false;
    try { field.select(); copied = document.execCommand("copy"); } catch (e) {}
    if (copied) { done(); return; }
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(done, failed);
        setTimeout(failed, 1500);   // still waiting on that permission: the button has to say something
        return;
      }
    } catch (e) {}
    failed();
  }

  /* ---- the sections ---------------------------------------------------------- */
  function inviteSection(c, d) {
    var url = d.token ? C().inviteUrl(d.token) : "";
    var field = el("input.camp-input.camp-link", { type: "text", readonly: "readonly", value: url, "aria-label": "Invite link", "data-camp": "link",
      onclick: function (e) { e.target.select(); } });
    return EN.ui.panel("Invite link", null, [
      el("p.help", { style: { margin: "0 0 8px" }, text: "Anyone with this link can ask to join. Reset it and the old one stops working." }),
      el("div.camp-line", null, [
        field,
        el("button.btn.sm.primary", { type: "button", "data-camp": "copy", disabled: !url, onclick: function () { copyLink(url, field); } }, "COPY"),
        EN.ui.armButton("campreset:" + c.id, { label: "RESET", armedLabel: "SURE? OLD LINK DIES", title: "Make a new link. The old one stops working.",
          onConfirm: function () { act(c.id, C().resetInvite(c.id), "New link made. The old one no longer works."); } })
      ])
    ]);
  }

  function classLabel(key) {
    var k = typeof key === "string" ? key : "", info = EN.classes && EN.classes[k];
    return info && info.name ? String(info.name).replace(/^The\s+/i, "") : (k ? k.toUpperCase() : "No class");
  }
  function charName(sheet) { return typeof sheet.name === "string" && sheet.name ? sheet.name : "Unnamed Freelancer"; }
  function charLine(c, m, sheet) {
    var lvl = typeof sheet.level === "number" ? sheet.level : 1;
    var writing = sendingTo(c, sheet.id);
    return el("div.camp-char-wrap", null, [
      el("div.camp-char", null, [
        el("span.camp-char-name", { text: charName(sheet) }),
        el("span.mgr-meta", { text: "L" + lvl + " · " + classLabel(sheet.class) }),
        el("button.btn.sm", { type: "button", "data-camp": "view", "data-char": sheet.id,
          title: "Read this sheet. Nothing on it can change from here.",
          onclick: function () { C().viewSheet(sheet.id, m.discord_name, c.id); } }, "VIEW SHEET"),
        el("button.btn.sm", { type: "button", "data-camp": "send", "data-char": sheet.id,
          title: "Send #POST mail to this character, signed as anyone you like.",
          onclick: function () { openSend(c, sheet.id); } }, "SEND")
      ]),
      writing ? composer(c, "To " + charName(sheet)) : null
    ]);
  }

  /* ---- #POST from the Admin: writing one -----------------------------------------
     Nothing here redraws the page while it is being typed in: each field writes to _send, and only
     the search's results and the attached list redraw, in place, inside their own nodes. */
  function sendingTo(c, to) { return !!_send && _send.campaign === c.id && _send.to === to; }
  function openSend(c, to) {
    // a second press folds it away with its words kept: Cancel is the one that throws them out
    if (sendingTo(c, to)) { _send.to = null; EN.app.render(); return; }
    var was = _send && _send.campaign === c.id && _send.uid === me() ? _send : null;
    // a message half written keeps its words when it is pointed at someone else
    _send = { uid: me(), campaign: c.id, to: to, from: was ? was.from : "", subj: was ? was.subj : "", body: was ? was.body : "",
              pkg: was ? was.pkg : [], search: "" };
    EN.app.render();
  }
  function me() { return EN.cloud && EN.cloud.userId ? EN.cloud.userId() : null; }
  function npcCards() {
    var list = EN.gmStore && EN.gmStore.list ? EN.gmStore.list("contacts") : [];
    return list.map(function (k) { return k && typeof k.name === "string" ? k.name.trim() : ""; })
      .filter(function (n, i, all) { return n && all.indexOf(n) === i; })
      .sort(function (a, b) { return a.localeCompare(b); });
  }
  function catalogHits(words) {
    var inv = EN.inventoryView, q = String(words || "").trim().toLowerCase();
    if (!q || !inv || !inv.sendable) return [];
    return inv.sendable().filter(function (it) { return it.name.toLowerCase().indexOf(q) !== -1; }).slice(0, RESULTS);
  }
  function drawHits(host, listHost) {
    EN.ui.clear(host);
    var words = _send.search, hits = catalogHits(words);
    if (!String(words || "").trim()) return;
    if (!hits.length) { host.appendChild(el("p.help", { style: { margin: "4px 0 0" }, text: "Nothing in the catalog goes by that." })); return; }
    hits.forEach(function (it) {
      host.appendChild(el("div.camp-hit", { "data-camp": "send-hit" }, [
        el("span.camp-hit-name", { text: it.name }),
        el("span.mgr-meta", { text: it.group || it.kind || "" }),
        el("button.btn.sm", { type: "button", "data-camp": "send-add", onclick: function () {
          var row = _send.pkg.filter(function (r) { return r.name === it.name; })[0];
          if (row) row.qty = Math.min(MAX_QTY, row.qty + 1);
          else if (_send.pkg.length >= MAX_ITEMS) { toast("A package holds " + MAX_ITEMS + " different items."); return; }
          else _send.pkg.push({ name: it.name, qty: 1 });
          drawAttached(listHost);
        } }, "+ ADD")
      ]));
    });
  }
  function drawAttached(host) {
    EN.ui.clear(host);
    _send.pkg.forEach(function (r) {
      host.appendChild(el("div.camp-hit", { "data-camp": "send-item" }, [
        el("span.camp-hit-name", { text: r.name }),
        el("label.camp-qty", null, [
          document.createTextNode("Qty "),
          el("input.camp-input.camp-qty-in", { type: "number", min: "1", max: String(MAX_QTY), step: "1", value: String(r.qty), "data-camp": "send-qty", "aria-label": "Quantity of " + r.name,
            onchange: function (e) {
              var n = Math.floor(Number(e.target.value));
              r.qty = isFinite(n) ? Math.max(1, Math.min(MAX_QTY, n)) : 1;
              e.target.value = String(r.qty);
            } })
        ]),
        el("button.btn.sm", { type: "button", "data-camp": "send-drop", title: "Take this out of the package", onclick: function () {
          _send.pkg = _send.pkg.filter(function (x) { return x !== r; });
          drawAttached(host);
        } }, "✕")
      ]));
    });
  }
  function sendNow(c, btn) {
    var s = _send;
    // held on the draft, not the button: a redraw while it is on its way draws a new button
    if (s.busy) return;
    var mail = { from: s.from.trim(), subj: s.subj.trim(), body: s.body.trim() };
    if (s.pkg.length) mail.package = s.pkg.map(function (r) { return { name: r.name, qty: r.qty }; });
    if (!mail.from) { toast("Who is it from? Pick a card or type a name."); return; }
    if (!mail.subj && !mail.body && !s.pkg.length) { toast("Add a subject, a message or a package."); return; }
    var crew = s.to === "crew", to = s.to;
    s.busy = true;
    btn.disabled = true;
    (crew ? C().sendToCrew(c.id, mail) : C().sendToCharacter(to, mail)).then(function (n) {
      if (_send === s) _send = null;
      if (crew && !n) toast("Nobody has a character in this campaign yet.");
      else toast(crew ? (n === 1 ? "Sent to 1 character." : "Sent to " + n + " characters.") : "Sent. It waits until their app picks it up.");
      delete _d[c.id];
      repaint();
    }, function (e) {
      console.warn("Could not send", e);
      s.busy = false;
      btn.disabled = false;
      toast(C().errText(e));
      // the character may have left: what the page shows is out of date, and the words are still in _send
      delete _d[c.id];
      repaint();
    });
  }
  function composer(c, title) {
    var s = _send;
    var attached = el("div.camp-hits", { "data-camp": "send-items" });
    var hits = el("div.camp-hits", { "data-camp": "send-hits" });
    var fromIn = el("input.camp-input", { type: "text", maxlength: "80", value: s.from, placeholder: "Any name", "aria-label": "From", "data-camp": "send-from",
      oninput: function (e) { s.from = e.target.value; } });
    var cards = npcCards();
    var box = el("div.camp-compose", { "data-camp": "composer" }, [
      el("div.camp-compose-to", { text: title }),
      el("label.fl", { text: "From" }),
      el("div.camp-line", null, [
        fromIn,
        cards.length ? el("select.camp-input.camp-npc", { "aria-label": "Sign as one of your People cards", "data-camp": "send-npc",
          onchange: function (e) { if (e.target.value) { s.from = e.target.value; fromIn.value = e.target.value; } e.target.value = ""; } },
          [el("option", { value: "", text: "A People card…" })].concat(cards.map(function (n) { return el("option", { value: n, text: n }); }))) : null
      ]),
      el("label.fl", { text: "Subject" }),
      el("input.camp-input.camp-wide", { type: "text", maxlength: "140", value: s.subj, "aria-label": "Subject", "data-camp": "send-subj",
        oninput: function (e) { s.subj = e.target.value; } }),
      el("label.fl", { text: "Message" }),
      el("textarea.camp-input.camp-wide.camp-body", { maxlength: "4000", value: s.body, "aria-label": "Message", "data-camp": "send-body",
        oninput: function (e) { s.body = e.target.value; } }),
      el("label.fl", { text: "Attach items" }),
      el("input.camp-input.camp-wide", { type: "text", value: s.search, placeholder: "Search the gear catalog", "aria-label": "Search the gear catalog", "data-camp": "send-search",
        oninput: function (e) { s.search = e.target.value; drawHits(hits, attached); } }),
      hits,
      attached,
      (function () {
        var go = el("button.btn.sm.primary", { type: "button", "data-camp": "send-go", disabled: !!s.busy, onclick: function () { sendNow(c, go); } }, "SEND");
        return el("div.camp-line", { style: { marginTop: "10px" } }, [
          go,
          el("button.btn.sm", { type: "button", "data-camp": "send-cancel", onclick: function () { _send = null; EN.app.render(); } }, "CANCEL")
        ]);
      })()
    ]);
    drawHits(hits, attached);
    drawAttached(attached);
    return box;
  }

  /* ---- #POST from the Admin: the list of sends --------------------------------------
     Their own sends only: that is what the read policy gives them, and js/campaigns.js asks for. A
     row whose character has left the campaign is off the roster, so it has no name to show. */
  var STATUS = { waiting: "WAITING", delivered: "DELIVERED", taken: "TAKEN", recalled: "RECALLED" };
  function nameOfRow(d, rowId) {
    var found = "";
    d.roster.forEach(function (m) {
      (Array.isArray(m.characters) ? m.characters : []).forEach(function (sheet) { if (sheet.id === rowId) found = charName(sheet); });
    });
    return found || "A character no longer here";
  }
  function sendRow(c, d, r) {
    var mail = r.mail || {}, pkg = Array.isArray(mail.package) ? mail.package : [];
    return el("div.camp-send", { "data-send": r.id, "data-status": r.status }, [
      el("div.camp-send-head", null, [
        el("b", { text: nameOfRow(d, r.character_id) }),
        el("span.chip.camp-role.camp-send-status", { text: STATUS[r.status] || String(r.status || "").toUpperCase() }),
        el("span", { style: { flex: "1 1 auto" } }),
        r.status === "waiting" ? el("button.btn.sm", { type: "button", "data-camp": "recall", title: "Take it back. It hasn't reached them yet.",
          onclick: function () { act(c.id, C().recallSend(r.id), "Recalled."); } }, "RECALL") : null
      ]),
      el("div.camp-send-line", { text: "From " + (mail.from || "") + (mail.subj ? " · " + mail.subj : "") }),
      pkg.length ? el("div.camp-send-line.camp-send-pkg", { text: pkg.map(function (x) { return x.name + " × " + x.qty; }).join(", ") }) : null
    ]);
  }
  function drawSends(host, c, d) {
    EN.ui.clear(host);
    if (d.sends === null) { host.appendChild(el("p.help", { style: { margin: 0 }, text: "Your sends could not be read just now." })); return; }
    if (!d.sends.length) { host.appendChild(el("p.help", { style: { margin: 0 }, text: "Nothing sent yet. Each send shows here until the player's app picks it up, and after." })); return; }
    d.sends.forEach(function (r) { host.appendChild(sendRow(c, d, r)); });
  }
  function sendsSection(c, d) {
    _sendsHost = el("div", { "data-camp": "sends", "data-campaign": c.id });
    drawSends(_sendsHost, c, d);
    return EN.ui.panel("#POST sends", d.sends ? String(d.sends.length) : null, [_sendsHost]);
  }
  /* A player's app moved a row along (js/cloud.js hears it): the list, and nothing else, reads again.
     A read already under way may have asked before the row moved, so it goes round again when it
     lands, and only the newest of these answers is drawn. */
  var _sendsAsk = 0;
  function sendsChanged(id) {
    var d = _d[id];
    if (!d || EN.app.activeTab() !== "campaign" || EN.app.portal() !== "admin") return;
    if (d.loading) { d.again = true; return; }
    var ask = ++_sendsAsk;
    C().sends(id).then(function (rows) {
      if (ask !== _sendsAsk) return;
      var now = _d[id];
      if (!now) return;
      if (now.loading) { now.again = true; return; }
      now.sends = rows || [];
      // the list on screen may be another campaign's, if the Admin runs more than one and has picked it since
      if (_sendsHost && _sendsHost.isConnected && _sendsHost.getAttribute("data-campaign") === id) drawSends(_sendsHost, { id: id }, now);
    }, function (e) { console.warn("Could not read your sends", e); });
  }
  function memberRow(c, m, isAdmin) {
    var chars = Array.isArray(m.characters) ? m.characters : [];
    var canRemove = m.role !== "admin" && (isAdmin || m.role === "player");
    var open = _remove && _remove.user === m.user_id;
    var acts = [];
    if (isAdmin && m.role !== "admin") {
      var toCo = m.role === "player";
      acts.push(el("button.btn.sm", { type: "button", "data-camp": toCo ? "make-coadmin" : "make-player",
        onclick: function () { act(c.id, C().setRole(c.id, m.user_id, toCo ? "coadmin" : "player")); } }, toCo ? "MAKE CO-ADMIN" : "MAKE PLAYER"));
    }
    if (canRemove) acts.push(el("button.btn.sm.danger", { type: "button", "data-camp": "remove",
      onclick: function () { _remove = open ? null : { user: m.user_id, block: false }; EN.app.render(); } }, "REMOVE"));
    return el("div.camp-member", { "data-member": m.user_id }, [
      el("div.camp-who", null, [
        el("b", { text: m.discord_name || "Freelancer" }),
        el("span.chip.camp-role", { text: m.role === "admin" ? "ADMIN" : m.role === "coadmin" ? "CO-ADMIN" : "PLAYER" }),
        el("span", { style: { flex: "1 1 auto" } }),
        acts.length ? el("div.camp-acts", null, acts) : null
      ]),
      chars.length ? el("div.camp-chars", null, chars.map(function (sheet) { return charLine(c, m, sheet); }))
                   : el("p.help", { style: { margin: "4px 0 0" }, text: "No characters in this campaign yet." }),
      open ? removeConfirm(c, m) : null
    ]);
  }
  function removeConfirm(c, m) {
    var name = m.discord_name || "This player";
    return el("div.camp-confirm", { "data-camp": "remove-confirm" }, [
      el("p", { text: name + " will lose access to " + c.name + ". Their characters stay in their account, unchanged." }),
      el("label.camp-check", null, [
        el("input", { type: "checkbox", checked: !!_remove.block, "data-camp": "also-block",
          onchange: function (e) { _remove.block = e.target.checked; } }),
        document.createTextNode(" Also block from rejoining")
      ]),
      el("div.camp-line", null, [
        el("button.btn.sm.danger.primary", { type: "button", "data-camp": "remove-go", onclick: function () {
          var block = !!_remove.block;
          _remove = null;
          act(c.id, C().removeMember(c.id, m.user_id, block), block ? name + " removed and blocked." : name + " removed.");
        } }, "REMOVE"),
        el("button.btn.sm", { type: "button", onclick: function () { _remove = null; EN.app.render(); } }, "CANCEL")
      ])
    ]);
  }
  function rosterSection(c, d, isAdmin) {
    var crew = 0;
    d.roster.forEach(function (m) { crew += Array.isArray(m.characters) ? m.characters.length : 0; });
    var writing = sendingTo(c, "crew");
    return EN.ui.panel("Roster", String(d.roster.length), [
      el("div.camp-line.camp-crew", null, [
        el("button.btn.sm", { type: "button", "data-camp": "send-crew", disabled: !crew,
          title: crew ? "Send the same #POST mail to every character in this campaign." : "Nobody has a character in this campaign yet.",
          onclick: function () { openSend(c, "crew"); } }, "SEND TO THE CREW")
      ]),
      writing ? composer(c, crew === 1 ? "To the crew: 1 character" : "To the crew: " + crew + " characters") : null
    ].concat(d.roster.map(function (m) { return memberRow(c, m, isAdmin); })));
  }
  function blockedSection(c, d) {
    var kids = d.blocked.length
      ? d.blocked.map(function (b) {
          return el("div.camp-who", { "data-blocked": b.user_id }, [
            el("b", { text: b.discord_name || "Freelancer" }),
            el("span", { style: { flex: "1 1 auto" } }),
            el("button.btn.sm", { type: "button", "data-camp": "unblock",
              onclick: function () { act(c.id, C().unblock(c.id, b.user_id), "Unblocked. They can use the invite link again."); } }, "UNBLOCK")
          ]);
        })
      : [el("p.help", { style: { margin: 0 }, text: "Nobody is blocked." })];
    return EN.ui.panel("Blocked", String(d.blocked.length), kids);
  }

  /* Delete and Transfer both confirm by typing the campaign's name. The button is enabled in place
     as the name is typed, so typing never redraws the page under the field. */
  function typedConfirm(c, kind, text, label, go) {
    var btn = el("button.btn.sm.danger.primary", { type: "button", disabled: true, "data-camp": kind + "-go", onclick: function () { _typed = null; go(); } }, label);
    return el("div.camp-confirm", { "data-camp": kind + "-confirm" }, [
      el("p", { text: text }),
      el("label.fl", { text: "Type the campaign's name to confirm" }),
      el("input.camp-input", { type: "text", "data-camp": kind + "-type", "aria-label": "Type the campaign's name to confirm", placeholder: c.name,
        oninput: function (e) { btn.disabled = e.target.value !== c.name; } }),
      el("div.camp-line", { style: { marginTop: "8px" } }, [
        btn,
        el("button.btn.sm", { type: "button", onclick: function () { _typed = null; EN.app.render(); } }, "CANCEL")
      ])
    ]);
  }
  function settingsSection(c, d) {
    var name = _renameDraft === null ? c.name : _renameDraft;
    var others = d.roster.filter(function (m) { return m.role !== "admin"; });
    if (!others.some(function (m) { return m.user_id === _transferTo; })) _transferTo = others.length ? others[0].user_id : "";
    var kids = [
      el("label.fl", { text: "Rename" }),
      el("div.camp-line", null, [
        el("input.camp-input", { type: "text", maxlength: "80", value: name, "aria-label": "Campaign name", "data-camp": "rename",
          oninput: function (e) { _renameDraft = e.target.value; } }),
        el("button.btn.sm", { type: "button", "data-camp": "rename-go", onclick: function () {
          var next = (_renameDraft === null ? c.name : _renameDraft).trim();
          _renameDraft = null;
          act(c.id, C().rename(c.id, next), "Renamed.");
        } }, "RENAME")
      ]),
      el("label.fl", { style: { marginTop: "14px" }, text: "Transfer leadership" })
    ];
    if (!others.length) kids.push(el("p.help", { style: { margin: 0 }, text: "There is nobody else in this campaign to hand it to." }));
    else {
      kids.push(el("div.camp-line", null, [
        el("select.camp-input", { "aria-label": "New Admin", "data-camp": "transfer-to", onchange: function (e) { _transferTo = e.target.value; } },
          others.map(function (m) { return el("option", { value: m.user_id, selected: m.user_id === _transferTo, text: m.discord_name || "Freelancer" }); })),
        el("button.btn.sm", { type: "button", "data-camp": "transfer", onclick: function () { _typed = { kind: "transfer", to: _transferTo }; EN.app.render(); } }, "TRANSFER")
      ]));
      if (_typed && _typed.kind === "transfer") {
        var pickd = others.filter(function (m) { return m.user_id === _typed.to; })[0];
        if (pickd) kids.push(typedConfirm(c, "transfer", (pickd.discord_name || "This player") + " becomes Admin. You become a co-Admin.", "TRANSFER LEADERSHIP",
          function () { act(c.id, C().transfer(c.id, pickd.user_id), (pickd.discord_name || "They") + " is the Admin now."); }));
      }
    }
    kids.push(el("label.fl", { style: { marginTop: "14px" }, text: "Delete" }));
    kids.push(el("div.camp-line", null, [
      el("button.btn.sm.danger", { type: "button", "data-camp": "delete", onclick: function () { _typed = { kind: "delete" }; EN.app.render(); } }, "DELETE CAMPAIGN")
    ]));
    if (_typed && _typed.kind === "delete") kids.push(typedConfirm(c, "delete", "Delete " + c.name + " for everyone? Every character in it stays in its player's account, in no campaign.", "DELETE CAMPAIGN",
      function () { act(c.id, C().remove(c.id), c.name + " deleted."); }));
    return EN.ui.panel("Campaign settings", null, kids);
  }

  /* ---- the page --------------------------------------------------------------- */
  function render(mount) {
    EN.ui.clear(mount);
    mount.appendChild(heading());
    if (!C() || !C().enabled()) {
      var online = !!(EN.cloud && EN.cloud.available && EN.cloud.available());
      mount.appendChild(el("div.muted-box", { "data-camp": "off", style: { padding: "26px" } }, [
        el("p", { style: { margin: "0 0 12px" }, text: "Jack in to run a campaign" }),
        online ? el("div.camp-jack", null, EN.cloud.signInButtons()) : el("p.help", { style: { margin: 0 }, text: "Discord sign-in needs the hosted app, elysiumnightsrpg.com/app." })
      ]));
      return;
    }
    var mine = C().running();
    if (!mine.length) {
      mount.appendChild(el("div.muted-box", { "data-camp": "none", style: { padding: "26px" } }, [
        el("p", { style: { margin: "0 0 12px" }, text: "You don't run a campaign yet." }),
        C().newForm()
      ]));
      return;
    }
    var want = C().pick();
    var c = mine.filter(function (x) { return x.id === want; })[0] || mine[0];
    // the Table's picker changes the campaign as well, so what is half done here is checked against it on the way in
    if (_for !== c.id) { _for = c.id; _remove = null; _typed = null; _renameDraft = null; _transferTo = ""; }
    if (mine.length > 1) {
      mount.appendChild(el("div.camp-line.camp-pick", null, [
        el("label.fl", { style: { margin: 0 }, text: "Campaign" }),
        el("select.camp-input", { "aria-label": "Campaign", "data-camp": "picker", onchange: function (e) {
          C().setPick(e.target.value); EN.app.render();
        } }, mine.map(function (x) { return el("option", { value: x.id, selected: x.id === c.id, text: x.name }); }))
      ]));
    }
    mount.appendChild(el("p.camp-title", { "data-camp": "title" }, [
      el("b", { text: c.name }),
      el("span.chip.camp-role", { text: c.role === "admin" ? "ADMIN" : "CO-ADMIN" }),
      el("button.btn.sm", { type: "button", "data-camp": "refresh", title: "Read the campaign again", onclick: function () { delete _d[c.id]; C().refresh(); EN.app.render(); } }, "↻ REFRESH")
    ]));
    var d = _d[c.id] || load(c.id);
    if (d.loading) { mount.appendChild(el("div.muted-box", { style: { padding: "26px" }, text: "Reading the campaign…" })); return; }
    if (d.error) {
      mount.appendChild(el("div.muted-box", { style: { padding: "26px" } }, [
        el("p", { style: { margin: "0 0 12px" }, text: d.error }),
        el("button.btn.sm", { type: "button", "data-camp": "retry", onclick: function () { delete _d[c.id]; EN.app.render(); } }, "TRY AGAIN")
      ]));
      return;
    }
    var isAdmin = c.role === "admin";
    // a message being written belongs to one account and one campaign
    if (_send && (_send.uid !== me() || _send.campaign !== c.id)) _send = null;
    mount.appendChild(el("div.camp-sections", null, [
      inviteSection(c, d),
      rosterSection(c, d, isAdmin),
      sendsSection(c, d),
      blockedSection(c, d),
      isAdmin ? settingsSection(c, d) : null
    ]));
  }

  return { render: render, stale: stale, invalidate: invalidate, sendsChanged: sendsChanged };
})();
