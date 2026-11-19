/* ===========================================================================
   ELYSIUM NIGHTS · #POST mail, drawn as an email client (18 Nov 2026, the author's call: "make the mail look more like an email")
   One look for both desktops: the Freelancer's #POST › Mail (js/face.js) and the Admin's #POST › MAIL (js/gm_post.js). This file
   draws and keeps nothing; each page hands it its letters and what a press does.
   - client(): the two panes. Down the left, the folders (Inbox, Sent) as tabs and the letters as rows the way a mail app lists
     them: who, when, the subject, and the first line of the letter, bold while unread. On the right, whatever the page hands it.
   - letter(): one letter, open. A toolbar (Reply, Mark unread, Delete, whatever the page gives), the subject, a header of From,
     To and Date, the letter itself, and the attachments (a package) under it.
   - compose(): a letter being written: To, From where the writer may choose, Subject, the letter, and Send and Discard.
   Uses the messenger's frame (css/theme.css .msgr) so the two pages of #POST sit the same on every skin and at phone width.
   No em or en dashes anywhere in this file (house style).
   =========================================================================== */
window.EN = window.EN || {};

EN.mailView = (function () {
  var el = EN.ui.el;
  function initials(n) { return String(n || "?").replace(/["'#]/g, "").split(/\s+/).filter(Boolean).map(function (w) { return w.charAt(0); }).join("").slice(0, 2).toUpperCase() || "?"; }
  function snippet(t) { return String(t || "").replace(/\s+/g, " ").trim().slice(0, 140); }

  /* opts: { title, actions: [nodes], folders: [{ key, label, count }], folder, onFolder(key), rows: [{ id, who, when, subj, body, unread, pkg,
     post: the row's data-post, sys }], sel, onOpen(row), empty, pane: [nodes], foot, open: whether the right pane holds something (phone layout) } */
  function client(opts) {
    var list = el("div.msgr-list.mail-list", { dataset: { keepScroll: "mail-list-" + (opts.folder || ""), post: "letters" } });
    if (!opts.rows.length) list.appendChild(el("p.msgr-empty", { dataset: { post: "mail-empty" }, text: opts.empty || "No letters." }));
    opts.rows.forEach(function (r) {
      list.appendChild(el("button.mail-row" + (r.id === opts.sel ? ".on" : "") + (r.unread ? ".un" : ""), { type: "button", "data-ro-keep": "1",
        dataset: { post: r.post || "letter", msg: r.id }, "aria-pressed": r.id === opts.sel ? "true" : "false", onclick: function () { opts.onOpen(r); } }, [
        el("span.mail-dot", { "aria-hidden": "true" }),
        el("span.mail-row-body", null, [
          el("span.mail-row-top", null, [el("b.mail-who", { text: r.who || "" }), el("span.mail-when", { text: r.when || "" })]),
          el("span.mail-row-subj", null, [el("span.msgr-tt", null, [el("b", { text: r.subj || "(no subject)" })]),
            r.pkg ? el("span.msgr-pk", { html: r.pkgIcon || "", title: "A package" }) : null]),
          el("span.mail-row-snip", { text: snippet(r.body) || " " })])]));
    });
    var tabs = el("div.mail-folders", { role: "tablist" }, (opts.folders || []).map(function (f) {
      return el("button.mail-folder" + (f.key === opts.folder ? ".on" : ""), { type: "button", role: "tab", "data-ro-keep": "1", "aria-selected": f.key === opts.folder ? "true" : "false",
        dataset: { post: "folder-" + f.key }, onclick: function () { opts.onFolder(f.key); } }, f.label + (f.count ? " · " + f.count : ""));
    }));
    var side = el("div.msgr-side", null, [
      el("div.msgr-sh", null, [el("h3", { text: opts.title || "Mail" }), el("span", { style: { flex: "1 1 auto" } })].concat(opts.actions || [])),
      tabs, list, opts.foot ? el("p.msgr-foot", { text: opts.foot }) : null]);
    var main = el("div.msgr-main.mail-pane", null, opts.pane);
    return el("div.msgr.mail", { dataset: { post: opts.post || "mail", pane: opts.open ? "thread" : "list" } }, [side, main]);
  }

  /* opts: { subj, from, to, when, body, avatar: { text } | { html }, tools: [nodes], attach: node, after: [nodes], status: text, back(), me } */
  function letter(opts) {
    // the initials are the person's, not a label beside the name ("Vex (Pat)" is Vex)
    var av = opts.avatar && opts.avatar.html ? el("span.mail-av.sys", { html: opts.avatar.html }) : el("span.mail-av", { text: initials(opts.who || opts.from) });
    var kids = [
      el("div.mail-tools", null, [
        opts.back ? el("button.btn.sm.ghost.msgr-back", { type: "button", "data-ro-keep": "1", dataset: { post: "back" }, title: "Back to the letters", onclick: opts.back }, "‹ LETTERS") : null,
        el("span", { style: { flex: "1 1 auto" } })].concat(opts.tools || [])),
      el("h2.mail-subj", { text: opts.subj || "(no subject)" }),
      el("div.mail-head", null, [av,
        el("div.mail-head-lines", null, [
          el("div", null, [el("span.mail-k", { text: "From" }), el("b", { text: opts.from || "Unknown node" })]),
          el("div", null, [el("span.mail-k", { text: "To" }), el("span", { text: opts.to || "You" })])]),
        el("span.mail-date", { text: opts.when || "" })]),
      opts.body ? el("div.mail-body", { text: opts.body }) : el("div.mail-body.dim", { text: "(no message)" })];
    if (opts.attach) kids.push(el("div.mail-attach", null, [el("div.mail-k", { text: "ATTACHMENT" }), opts.attach]));
    if (opts.status) kids.push(el("div.mail-status", { dataset: { post: "seen", seen: opts.status === "Seen" ? "1" : "0" }, text: opts.status }));
    return el("article.mail-read" + (opts.me ? ".me" : "") + (opts.unread ? ".new" : ""), { dataset: { post: "letter-view", msg: opts.id || "" } }, kids.concat(opts.after || []));
  }

  /* opts: { title, to: text or node, from: node (optional), subj, body, onSubj(v), onBody(v), send(), discard(), busy, sendLabel, post: prefix for data-post,
     placeholder, extra: [nodes] under the letter (a package search, say) } */
  function compose(opts) {
    var P = opts.post || "mail";
    function row(k, field) { return el("div.mail-crow", null, [el("span.mail-k", { text: k }), field]); }
    return el("div.mail-compose", { dataset: { post: P + "-compose" } }, [
      opts.title ? el("div.mail-ctitle", { text: opts.title }) : null,
      row("To", typeof opts.to === "string" ? el("span.mail-cto", { text: opts.to }) : opts.to),
      opts.from ? row("From", opts.from) : null,
      row("Subject", el("input", { type: "text", maxlength: "140", value: opts.subj || "", placeholder: "Subject", "aria-label": "Subject", dataset: { post: P + "-subj" },
        oninput: function (e) { opts.onSubj(e.target.value); } })),
      el("textarea.mail-ctext", { maxlength: "4000", value: opts.body || "", placeholder: opts.placeholder || "Write your letter", "aria-label": "Letter", dataset: { post: P + "-body" },
        oninput: function (e) { opts.onBody(e.target.value); } })].concat(opts.extra || []).concat([
      el("div.mail-cfoot", null, [
        el("button.btn.primary", { type: "button", disabled: !!opts.busy, dataset: { post: P + "-send" }, onclick: opts.send }, opts.busy ? "SENDING…" : (opts.sendLabel || "SEND")),
        opts.discard ? el("button.btn.sm.ghost", { type: "button", dataset: { post: P + "-discard" }, onclick: opts.discard }, "DISCARD") : null])]));
  }

  return { client: client, letter: letter, compose: compose, initials: initials };
})();
