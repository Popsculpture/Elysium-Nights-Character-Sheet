/* ===========================================================================
   ELYSIUM NIGHTS · the Admin desktop's landing page (18 Nov 2026, the author's call)
   Choosing the Admin desktop (Settings, // WORKSPACE) no longer drops a GM straight onto whatever campaign the tab was on
   last: it opens here first, a page that lists the campaigns this account runs to pick one from, and makes a new one. The
   pick is the same one the top bar's campaign picker makes (EN.campaigns.setPick), so everything that follows it (which
   desktop, which Table, which mail) follows from here too. A reload, ?portal=admin and every way onto the desktop other
   than the switch itself land on the desktop as before: a fight in progress is never put behind a page.
   Not jacked in, there is no campaign to pick: the page says so, offers the sign-in, and offers this device's own desktop,
   which is what the Admin desktop always was without an account.
   No em or en dashes anywhere in this file (house style).
   =========================================================================== */
window.EN = window.EN || {};

EN.gmLanding = (function () {
  var el = EN.ui.el, toast = EN.ui.toast;
  function C() { return EN.campaigns; }
  var _new = { name: "", busy: false };

  // into the desktop, on this campaign (or this device's own, NO_CAMPAIGN), on the tab it was last on
  function enter(id) {
    C().setPick(id);
    EN.app.leaveLanding();
  }
  function create() {
    var name = String(_new.name || "").trim();
    if (!name) { toast("Give the campaign a name."); var i = document.querySelector('#view [data-land="new-name"]'); if (i) i.focus(); return; }
    if (_new.busy) return;
    _new.busy = true; EN.app.render();
    Promise.resolve().then(function () { return C().create(name); }).then(function (id) {
      _new.busy = false; _new.name = "";
      // create_campaign answers the new campaign's id; the list was read again on the way back (afterRoster)
      var made = typeof id === "string" && id ? id : (C().running().filter(function (c) { return c.name === name; })[0] || {}).id;
      toast("Campaign created. Its invite link is on the Sysop tab.");
      if (made) enter(made); else EN.app.render();
    }, function (e) {
      _new.busy = false;
      console.warn("Could not create the campaign", e);
      toast(C().errText(e));
      EN.app.render();
    });
  }

  function card(c, last) {
    var role = c.role === "admin" ? "ADMIN" : "CO-ADMIN";
    return el("button.land-card" + (last ? ".last" : ""), { type: "button", dataset: { land: "open", id: c.id }, title: "Open " + c.name + "'s desktop",
      onclick: function () { enter(c.id); } }, [
      el("span.land-mark", { "aria-hidden": "true", text: "◆" }),
      el("span.land-name", null, [el("b", { text: c.name }), el("small", { text: role + (last ? "  ·  LAST OPEN" : "") })]),
      el("span.land-go", { text: "OPEN ›" })]);
  }
  function newBlock(first) {
    var input = el("input.camp-input", { type: "text", maxlength: "80", value: _new.name, placeholder: "Campaign name", "aria-label": "Campaign name", dataset: { land: "new-name" },
      oninput: function (e) { _new.name = e.target.value; },
      onkeydown: function (e) { if (e.key === "Enter") { e.preventDefault(); create(); } } });
    return el("div.land-new", { dataset: { land: "new" } }, [
      el("div.land-h", { text: first ? "START YOUR FIRST CAMPAIGN" : "START A NEW CAMPAIGN" }),
      el("p.help", { style: { margin: "0 0 8px" }, text: "You run it: you get its Admin desktop and an invite link for your players." }),
      el("div.land-row", null, [input,
        el("button.btn.primary", { type: "button", disabled: _new.busy, dataset: { land: "create" }, onclick: create }, _new.busy ? "CREATING…" : "CREATE")])]);
  }

  function render(mount) {
    EN.ui.clear(mount);
    var on = !!(C() && C().enabled && C().enabled());
    var mine = on ? C().running() : [], last = on ? C().desktop() : null;
    var kids = [el("div", { style: { marginBottom: "16px" } }, [
      el("h1", { style: { fontSize: "22px", margin: "0 0 2px", letterSpacing: ".04em" },
        html: "ADMIN <span style='color:var(--accent)'>DESKTOP</span> <span style='font-family:var(--disp);font-size:12px;color:var(--text3);letter-spacing:.18em'>// PICK YOUR TABLE</span>" }),
      el("p.help", { style: { margin: 0, maxWidth: "720px" }, text: on
        ? "Every campaign has its own desktop: its Table, its crew, its plans and its mail. Open the one you are running tonight, or start a new one."
        : "Campaigns live on your account. Jack in to open yours or start one, or use this device's own desktop, which keeps everything on this browser." })])];

    if (!on) {
      var cloud = EN.cloud && EN.cloud.signInButtons && EN.cloud.client && EN.cloud.client();
      kids.push(el("div.land-box", { dataset: { land: "signed-out" } }, [
        el("div.land-h", { text: "NOT JACKED IN" }),
        cloud ? el("div.land-jack", null, EN.cloud.signInButtons()) : el("p.help", { style: { margin: 0 }, text: "Sign-in needs the hosted app, elysiumnightsrpg.com/app." })]));
    } else {
      if (mine.length) {
        kids.push(el("div.land-h", { text: "YOUR CAMPAIGNS" }));
        // the one this tab was last on first, then the rest as the account lists them
        var sorted = mine.slice().sort(function (a, b) { return (last && b.id === last.id ? 1 : 0) - (last && a.id === last.id ? 1 : 0); });
        kids.push(el("div.land-list", { dataset: { land: "list" } }, sorted.map(function (c) { return card(c, !!last && c.id === last.id); })));
      } else {
        kids.push(el("div.land-box", { dataset: { land: "none" } }, [el("p.help", { style: { margin: 0 }, text: "You don't run a campaign yet. Players' campaigns are on the Freelancer desktop; this one is for the tables you run." })]));
      }
      kids.push(newBlock(!mine.length));
    }
    kids.push(el("div.land-foot", null, [
      el("button.btn.sm.ghost", { type: "button", dataset: { land: "device" }, title: "The Admin desktop with no campaign: everything stays on this browser",
        onclick: function () { enter(C() ? C().NO_CAMPAIGN : "none"); } }, "THIS DEVICE'S OWN DESKTOP ›"),
      el("button.btn.sm.ghost", { type: "button", dataset: { land: "freelancer" }, onclick: function () { EN.app.setPortal("freelancer"); } }, "‹ BACK TO THE FREELANCER DESKTOP")]));
    mount.appendChild(el("div.land", { dataset: { land: "page" } }, kids));
  }

  return { render: render };
})();
