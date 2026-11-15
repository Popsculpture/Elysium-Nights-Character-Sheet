/* ===========================================================================
   ELYSIUM NIGHTS · #GRIDeck: #POST as a messenger (P5, 15 Nov 2026).
   The Freelancer's mail, read the way a phone reads it: the people who wrote on the left, the letters from the
   one who is picked in the middle with a place to answer under them, and that person's contact card on the
   right. It is the same mail on the same record (ch.face.post) as the Social tab's #POST page; a "thread" is
   only the letters that carry one sender's name, newest at the bottom.

   What it keeps from that page, because the mail works that way and a messenger must not pretend otherwise:
   - A letter can carry a package. Take it is the tab's own (it asks the inbox first, so two devices cannot
     take it twice).
   - A letter that came through the campaign can be answered, and the answer goes to the GM as a letter with a
     subject, through the database. Letters the player sent are read back from there, with whether they were
     read; they carry no time the record's letters can be sorted against, so they sit under the ones received.
   - A player may log a letter by hand and edit it. Notices the app signs cannot be answered.

   Every read and write is the Social tab's own (EN.faceView.core). DOM rules as in js/deck_shell.js. It is
   redrawn on every render, so the thread picked is kept in S; what is being typed to the GM lives in the
   tab's own draft and what is typed into a logged letter is written without a redraw.
   No em or en dashes anywhere in this file (house style).
   =========================================================================== */
window.EN = window.EN || {};
EN.deck = EN.deck || {};
EN.deck.post = (function () {
  var el = EN.ui.el;
  var S = { th: null, pane: "list", edit: null, arm: null };

  function F() { return EN.faceView.core; }
  function redraw() { EN.app.render(); }
  function chip(text, tone, title) { return el("span.dk-chip" + (tone ? "." + tone : ""), { title: title || null, text: text }); }
  function btn(label, tone, name, fn, title, off) {
    return el("button.dk-btn" + (tone ? "." + tone : ""), { type: "button", title: title || null, disabled: !!off, dataset: { dkDo: name }, onclick: fn }, label);
  }
  // a button that only changes what is showing: it still takes a click on a read-only record (js/deck_shell.js, segBar)
  function nav(label, tone, name, fn, title, off) { var n = btn(label, tone, name, fn, title, off); n.setAttribute("data-ro-keep", "1"); return n; }
  function initials(n) { return String(n || "?").replace(/["'#]/g, "").split(/\s+/).filter(Boolean).map(function (w) { return w.charAt(0); }).join("").slice(0, 2).toUpperCase() || "?"; }
  function avatar(t, big) {
    return el("span.dk-av" + (big ? ".dk-big-av" : "") + (t.sys || t.gm ? ".dk-sys" : ""), t.sys || t.gm ? { html: (EN.faceView.icons || {}).post || "" } : { text: initials(t.name) });
  }
  function keyOf(name) { return "t:" + String(name || "").trim().toLowerCase(); }

  /* the threads: one a sender, in the order their newest letter sits in the mail (newest first) */
  function threads(ch, ctx) {
    var post = F().read(ch).post, map = {}, order = [];
    function get(key, name, more) {
      if (!map[key]) { map[key] = { key: key, name: name, msgs: [], sent: [], unread: 0, sys: false, gm: false }; order.push(key); }
      if (more) Object.keys(more).forEach(function (k) { map[key][k] = more[k]; });
      return map[key];
    }
    post.forEach(function (m, i) {
      if (!m) return;
      var name = String(m.from || "").trim() || "Unknown node", t = get(keyOf(name), name);
      t.msgs.push({ m: m, i: i });
      if (!m.read) t.unread++;
      if (F().fromSystem(m)) t.sys = true;
    });
    if (ctx) {
      F().sentToGm(ctx).forEach(function (r) {
        var who = String(r.persona || "").trim();
        (who ? get(keyOf(who), who) : get("gm", "Your GM", { gm: true, sub: ctx.campaignName })).sent.push(r);
      });
      if (!map.gm) { map.gm = { key: "gm", name: "Your GM", sub: ctx.campaignName, msgs: [], sent: [], unread: 0, sys: false, gm: true }; order.unshift("gm"); }
    }
    return order.map(function (k) { return map[k]; });
  }
  function contactOf(ch, t) {
    if (t.sys || t.gm) return null;
    var n = t.name.toLowerCase();
    return F().read(ch).contacts.filter(function (c) { return c && [c.name, c.handle, c.print].some(function (v) { return String(v || "").trim().toLowerCase() === n; }); })[0] || null;
  }
  function open(X, t) {
    S.th = t.key; S.pane = "thread"; S.edit = null; S.arm = null;
    // opening a thread is reading it: that is what clears the dock's badge. Not on a read-only record: the store refuses the
    // write without a word, so nothing would redraw, and somebody looking at a sheet has not read its owner's mail
    if (t.unread && !X.ro) F().write(function (f) { t.msgs.forEach(function (x) { if (f.post[x.i] && f.post[x.i].id === x.m.id) f.post[x.i].read = true; }); });
    else redraw();
  }
  function logNew(from) {
    var m = { id: F().newMessageId(), from: from || "", subj: "", when: "", body: "", read: true };
    S.th = keyOf(m.from || "Unknown node"); S.pane = "thread"; S.edit = m.id;
    F().write(function (f) { f.post.unshift(m); });
  }

  /* ---- the list of people ---- */
  function list(X, all) {
    var out = [el("div.dk-ph", null, [el("h4.dk-sec", { text: "#POST" }), el("span.dk-grow"),
      F().readOnly() ? null : btn("+ Log a letter", "sm.ghost", "log", function () { logNew(""); }, "Log something that came in, or write one yourself")])];
    if (!all.length) out.push(el("p.dk-empty", { text: "No traffic. #POST is holding nothing for this handle." }));
    all.forEach(function (t) {
      var last = t.msgs[0] ? t.msgs[0].m : null, sent = !last && t.sent.length ? t.sent[0] : null;
      var line = last ? (last.subj || last.body || "(no subject)") : sent ? "You: " + ((sent.mail || {}).subj || (sent.mail || {}).body || "(no subject)") : t.gm ? "Write to the people who run " + (t.sub || "your campaign") : "";
      var parcel = t.msgs.some(function (x) { return F().hasPackage(x.m) && !x.m.taken; });
      out.push(el("button.dk-th" + (S.th === t.key ? ".on" : "") + (t.unread ? ".dk-un" : ""), { type: "button", "data-ro-keep": "1", "aria-pressed": S.th === t.key ? "true" : "false", dataset: { dkThread: t.key, dkUnread: String(t.unread) },
        onclick: function () { open(X, t); } }, [avatar(t),
        el("span.dk-th-t", null, [el("b", null, [t.name, last && last.when ? el("small", { text: last.when }) : null]), el("span", { text: line })]),
        parcel ? el("span.dk-ic.dk-pkg-i", { html: F().pkgIcon, title: "A package is waiting" }) : null,
        t.unread ? el("i.dk-ud", { title: t.unread + (t.unread === 1 ? " unread" : " unread"), text: String(t.unread) }) : null]));
    });
    out.push(el("p.dk-empty.dk-ph-foot", { text: F().postHelp }));
    return out;
  }

  /* ---- one letter ---- */
  function letter(X, t, x) {
    var m = x.m, i = x.i, ro = F().readOnly(), mine = !m.inboxId;
    function put(k, v, silent) { F().write(function (f) { if (f.post[i] && f.post[i].id === m.id) f.post[i][k] = v; }, silent); }
    if (S.edit === m.id && !ro) {
      function fld(k, label, ph) { return el("label.dk-fld", null, [el("span", { text: label }), el("input.dk-in", { type: "text", value: m[k] || "", placeholder: ph, dataset: { dkEdit: k }, oninput: function () { put(k, this.value, true); } })]); }
      return el("div.dk-m.dk-m-edit", { dataset: { dkMsg: m.id } }, [
        el("div.dk-g3", null, [fld("from", "From", "NULLJACK"), fld("subj", "Subject", "Work, if you want it"), fld("when", "When", "03:14, Tuesday")]),
        el("textarea.dk-in.dk-notes", { value: m.body || "", placeholder: "The message", "aria-label": "Message", dataset: { dkEdit: "body" }, oninput: function () { put("body", this.value, true); } }),
        el("div.dk-row", null, [btn("Done", "pri.sm", "edit-done", function () { S.edit = null; S.th = keyOf(String((F().read(EN.store.active()).post[i] || m).from || "").trim() || "Unknown node"); redraw(); })])]);
    }
    var kids = [];
    if (m.subj) kids.push(el("b.dk-m-s", { text: m.subj }));
    if (m.body) kids.push(el("p.dk-m-b", { text: m.body }));
    if (!m.subj && !m.body) kids.push(el("p.dk-m-b.dk-dim", { text: "(empty)" }));
    if (F().hasPackage(m)) kids.push(el("div.dk-pkg", { dataset: { dkPkg: m.taken ? "taken" : "waiting" } }, [el("span.dk-ic", { html: F().pkgIcon }),
      el("span.dk-two", null, [el("b", { text: "Package" }), el("small", { text: m.package.map(function (r) { return r.name + " ×" + r.qty + (r.refused ? " (not in the catalog)" : ""); }).join(", ") })]),
      el("span.dk-grow"),
      m.taken ? chip("In your stash", "ok") : btn(F().taking(m.id) ? "Asking" : "Take it", "pri.sm", "take", function () { F().takeIt(m.id); }, ro ? "This record is read-only" : "Move these into your Stash", ro || F().taking(m.id))]));
    var waiting = F().hasPackage(m) && !m.taken, armed = S.arm === m.id;
    kids.push(el("div.dk-m-f", null, [el("small", { text: m.when || "" }), el("span.dk-grow"),
      ro ? null : el("button.dk-link", { type: "button", dataset: { dkDo: "unread" }, onclick: function () { put("read", !m.read); } }, m.read ? "Mark unread" : "Mark read"),
      ro || !mine ? null : el("button.dk-link", { type: "button", dataset: { dkDo: "edit" }, onclick: function () { S.edit = m.id; redraw(); } }, "Edit"),
      ro ? null : el("button.dk-link.dk-badt", { type: "button", dataset: { dkDo: "delete" }, title: waiting ? "The package in it goes too" : "It is not kept anywhere else",
        onclick: function () {
          if (waiting && !armed) { S.arm = m.id; redraw(); return; }
          S.arm = null;
          F().write(function (f) { if (f.post[i] && f.post[i].id === m.id) f.post.splice(i, 1); });
        } }, armed ? "Sure? The package goes too" : "Delete")]));
    return el("div.dk-m" + (m.read ? "" : ".dk-m-new"), { dataset: { dkMsg: m.id } }, kids);
  }
  function composer(X, t) {
    var ctx = X.ctx;
    if (t.sys) return el("div.dk-pnote", { dataset: { dkCompose: "none" }, text: "Notices arrive here with your mail. They cannot be answered." });
    // the newest letter that came through the campaign is the one an answer answers
    var target = t.gm ? null : (t.msgs.filter(function (x) { return x.m.inboxId && !F().fromSystem(x.m); })[0] || {}).m || null;
    if (!ctx || (!t.gm && !target)) return el("div.dk-pnote", { dataset: { dkCompose: "none" },
      text: t.gm ? "" : ctx ? "This letter was logged by hand, so there is nobody on the other end to answer here." : "Answers go through your campaign: link this record to one, and jack in, to write back." });
    var d = F().gmDraftFor(ctx, target);
    return el("div.dk-cmp", { dataset: { dkCompose: t.gm ? "gm" : "reply" } }, [
      el("input.dk-in", { type: "text", maxlength: "140", value: d.subj, placeholder: "Subject", "aria-label": "Subject", dataset: { dkDraft: "subj" }, oninput: function () { d.subj = this.value; } }),
      el("div.dk-cmp-row", null, [
        el("textarea.dk-in", { maxlength: "4000", value: d.body, placeholder: t.gm ? "Write to the people who run " + ctx.campaignName : "Answer " + t.name, "aria-label": "Message", dataset: { dkDraft: "body" }, oninput: function () { d.body = this.value; } }),
        btn("Send", "pri", "send", function () { F().sendGm(ctx); }, t.gm ? "It goes to your GM" : "It goes to the GM, as " + t.name + "'s reply", !!d.busy)])]);
  }
  function thread(X, t) {
    var c = contactOf(X.ch, t);
    var head = el("div.dk-pt-h", null, [el("button.dk-link.dk-back.dk-pback", { type: "button", "data-ro-keep": "1", dataset: { dkDo: "back" }, onclick: function () { S.pane = "list"; redraw(); } }, "‹"),
      avatar(t), el("b", { text: t.name }), t.sys ? chip("Notice") : t.gm ? chip(t.sub || "Campaign", "acc") : c ? chip((F().kinds.filter(function (k) { return k.k === c.kind; })[0] || {}).label || "Contact", "acc") : null,
      el("span.dk-grow"),
      F().readOnly() || t.sys || t.gm ? null : btn("Log a letter", "sm.ghost", "log-here", function () { logNew(t.name); }, "Log a letter from " + t.name + " by hand")]);
    var msgs = t.msgs.slice().reverse().map(function (x) { return letter(X, t, x); });
    if (t.sent.length) {
      msgs.push(el("div.dk-m-div", { text: "Sent by you" }));
      t.sent.slice().reverse().forEach(function (r) {
        var mail = r.mail || {};
        msgs.push(el("div.dk-m.dk-me", { dataset: { dkSent: r.status || "" } }, [mail.subj ? el("b.dk-m-s", { text: mail.subj }) : null, mail.body ? el("p.dk-m-b", { text: mail.body }) : null,
          el("div.dk-m-f", null, [el("span.dk-grow"), el("small", { text: r.status === "read" ? "Read" : "Not read yet" })])]));
      });
    }
    if (!msgs.length) msgs.push(el("p.dk-empty", { text: t.gm ? "Nothing sent yet. What you write goes to the people who run " + (t.sub || "your campaign") + "." : "No letters." }));
    return [head, el("div.dk-msgs", { dataset: { keepScroll: "post" } }, msgs), composer(X, t)];
  }
  function card(X, t) {
    if (!t) return [el("p.dk-empty", { text: "" })];
    if (t.sys) return [avatar(t, true), el("h3", { text: t.name }), el("p.dk-empty", { text: "A notice the app signs. It has no contact card." })];
    if (t.gm) return [avatar(t, true), el("h3", { text: "Your GM" }), el("p.dk-empty", { text: "The people who run " + (t.sub || "your campaign") + ". Letters go to them through the campaign; nothing about them is kept on your record." })];
    var c = contactOf(X.ch, t);
    if (!c) return [avatar(t, true), el("h3", { text: t.name }), el("p.dk-empty", { text: "Not in your contacts." }),
      F().readOnly() ? null : btn("Add to contacts", "", "add-contact", function () { F().newContact({ name: t.name }); EN.faceView.setSub("contacts"); redraw(); }, "Start a contact card for " + t.name)];
    function kv(label, v) { return v ? [el("i", { text: label }), el("p", { text: v })] : []; }
    var disp = F().standings.filter(function (s) { return s.k === c.disposition; })[0], state = F().states.filter(function (s) { return s.k === c.state; })[0];
    return [avatar(t, true), el("h3", { text: c.name || t.name }),
      el("div.dk-chips", null, [chip((F().kinds.filter(function (k) { return k.k === c.kind; })[0] || {}).label || "Contact", "acc"), disp ? chip(disp.label) : null, c.state === "burned" ? chip("Burned", "bad") : state ? chip(state.label) : null]),
      el("div.dk-kv", null, [].concat(kv("Handle", c.handle), kv("Work", c.work), kv("Why they pick up", c.why), kv("Offers", c.offers), kv("Faction", c.faction), kv("Tell", c.tell), kv("Notes", c.notes))),
      nav("Open in Contacts", "ghost", "open-contacts", function () { EN.faceView.setSub("contacts"); redraw(); })];
  }

  function render(stage, c) {
    var ch = c.ch, ctx = null;
    try { ctx = F().gmContext(ch); } catch (e) { ctx = null; }
    var X = { ch: ch, ctx: ctx, ro: !!c.readOnly }, all = threads(ch, ctx);
    var t = all.filter(function (x) { return x.key === S.th; })[0] || null;
    if (!t) { S.th = null; if (S.pane === "thread") S.pane = "list"; }
    var root = el("div.dk.dk-post", { dataset: { dkPost: "1", dkPane: S.pane } });
    root.appendChild(el("div.dk-col.dk-pl", { dataset: { dkPostList: String(all.length) } }, list(X, all)));
    root.appendChild(el("div.dk-pt", { dataset: { dkPostThread: t ? t.key : "" } }, t ? thread(X, t) : [el("p.dk-empty.dk-pt-none", { text: all.length ? "Pick someone on the left to read their letters." : "Nothing has come in yet." })]));
    root.appendChild(el("div.dk-col.dk-pc", { dataset: { dkPostCard: t ? t.key : "" } }, t ? card(X, t) : []));
    stage.appendChild(root);
    // a thread opens on its newest letter, which is at the bottom
    var box = root.querySelector(".dk-msgs");
    if (box && S.justOpened !== S.th) { S.justOpened = S.th; box.scrollTop = box.scrollHeight; }
  }

  return { render: render, state: S, threads: threads };
})();
