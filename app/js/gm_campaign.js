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

  function stale() { _d = {}; _remove = null; _typed = null; _renameDraft = null; _transferTo = ""; }
  // what the campaign holds is out of date, but a confirm that is open stays open
  function invalidate() { _d = {}; }

  function load(id) {
    var slot = _d[id] = { loading: true };
    var runs = C();
    Promise.all([runs.roster(id), runs.invite(id), runs.blocked(id)]).then(function (all) {
      if (_d[id] !== slot) return;
      _d[id] = { roster: all[0] || [], token: all[1] || "", blocked: all[2] || [] };
      repaint();
    }, function (e) {
      if (_d[id] !== slot) return;
      console.warn("Could not read the campaign", e);
      _d[id] = { error: runs.errText(e) };
      repaint();
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
    function done() { toast("Invite link copied."); }
    function failed() { toast("Could not copy it. The link is in the box."); }
    // the old way first: it answers at once, where the newer one can sit waiting on a permission
    var copied = false;
    try { field.select(); copied = document.execCommand("copy"); } catch (e) {}
    if (copied) { done(); return; }
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(url).then(done, failed); return; }
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
  function charLine(c, m, sheet) {
    var lvl = typeof sheet.level === "number" ? sheet.level : 1;
    return el("div.camp-char", null, [
      el("span.camp-char-name", { text: typeof sheet.name === "string" && sheet.name ? sheet.name : "Unnamed Freelancer" }),
      el("span.mgr-meta", { text: "L" + lvl + " · " + classLabel(sheet.class) }),
      el("button.btn.sm", { type: "button", "data-camp": "view", "data-char": sheet.id,
        title: "Read this sheet. Nothing on it can change from here.",
        onclick: function () { C().viewSheet(sheet.id, m.discord_name, c.id); } }, "VIEW SHEET")
    ]);
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
    return EN.ui.panel("Roster", String(d.roster.length), d.roster.map(function (m) { return memberRow(c, m, isAdmin); }));
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
    if (mine.length > 1) {
      mount.appendChild(el("div.camp-line.camp-pick", null, [
        el("label.fl", { style: { margin: 0 }, text: "Campaign" }),
        el("select.camp-input", { "aria-label": "Campaign", "data-camp": "picker", onchange: function (e) {
          C().setPick(e.target.value); _remove = null; _typed = null; _renameDraft = null; _transferTo = ""; EN.app.render();
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
    mount.appendChild(el("div.camp-sections", null, [
      inviteSection(c, d),
      rosterSection(c, d, isAdmin),
      blockedSection(c, d),
      isAdmin ? settingsSection(c, d) : null
    ]));
  }

  return { render: render, stale: stale, invalidate: invalidate };
})();
