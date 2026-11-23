/* ===========================================================================
   ELYSIUM NIGHTS · #GRIDOS '98, THE SITES' LOOKS (23 Nov 2026, the designer's boards, gridos-98-sites-handoff)

   Magpie (js/w98_web.js) hosts the app's own pages as sites. This file dresses each one as the designer drew it: a
   masthead, a sidebar where the board has one, a footer, and the banners and link buttons the boards place. The page
   in the middle is still the app's, drawn by its own module (Social, the Stash's Bills and market, the Codex); its
   colours and type are restyled in css/w98_sites.css. Nothing here changes a rule, a price or a payout.

   How the parts sit: Magpie's window client holds #view (the live page) or its frozen copy. The parts drawn here are
   the client's other children, laid out around it on a CSS grid (head, side, main, foot), so they scroll with the page
   and survive every render of #view. They are drawn after each render (EN.w98.ext.paint) while the site is live, and
   kept as they were while the window is in the background.

   The Register's receipt and Guild Surplus's book price ride the market's card hooks (js/inventory.js CARD_HOOKS):
   display lines under a listing's head, worked from the real price.

   Original names and art only: no real site's logo, name, wordmark or font file. No em or en dashes (house style).
   =========================================================================== */
window.EN = window.EN || {};

EN.w98sites = (function () {
  if (!EN.w98 || !EN.w98.kit || !EN.w98.ext || !EN.w98web || !EN.w98web.sites) return {};
  var K = EN.w98.kit, X = EN.w98.ext, el = K.el, WEB = EN.w98web, SITES = WEB.sites;

  function on98fl() { return document.documentElement.classList.contains("skin-98") && K.portal() === "freelancer"; }
  function inv() { return EN.inventoryView || null; }
  function go(site) { WEB.go(site); }
  function svg(html) { var s = el("span.w98-svg", { "aria-hidden": "true" }); s.innerHTML = html; return s.firstChild ? s : s; }

  /* ======================================================================== THE LOGOS (vector, from the boards) */
  var LOGO = {
    namedrop: function (w, h) {
      return '<svg width="' + w + '" height="' + h + '" viewBox="-6 -8 112 88" aria-hidden="true"><g transform="rotate(-5 50 36)">' +
        '<rect x="2" y="2" width="96" height="68" rx="9" fill="#F2F4F7" stroke="#2A3F6E" stroke-width="3"/>' +
        '<path d="M3.5 28 V11 a7.5 7.5 0 0 1 7.5 -7.5 H89 a7.5 7.5 0 0 1 7.5 7.5 V28 Z" fill="#5B7FC0"/>' +
        '<rect x="3.5" y="60" width="93" height="5" fill="#5B7FC0"/>' +
        '<text x="50" y="23" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="17" fill="#F2F4F7" letter-spacing="2">HELLO</text>' +
        '<path d="M14 50 C20 34 26 36 24 46 C22 56 34 38 40 44 C46 50 50 40 56 44 C62 48 70 42 86 46" fill="none" stroke="#2A3F6E" stroke-width="3" stroke-linecap="round"/></g></svg>';
    },
    burnrate: function (px) {
      return '<svg width="' + px + '" height="' + px + '" viewBox="0 0 96 96" aria-hidden="true"><rect x="2" y="2" width="92" height="92" rx="18" fill="#14295A"/>' +
        '<path d="M50 14 C54 28 70 36 70 54 C70 68 60 76 48 76 C36 76 26 68 26 55 C26 46 31 40 36 34 C38 40 40 43 43 44 C42 32 45 22 50 14 Z" fill="#FFFFFF"/>' +
        '<path d="M49 46 C52 52 58 56 58 63 C58 69 54 72 48 72 C42 72 38 69 38 63 C38 57 46 54 49 46 Z" fill="#14295A"/>' +
        '<rect x="22" y="82" width="52" height="3" fill="#E0242F"/></svg>';
    },
    undercut: function (px, ink) {
      ink = ink || "#5A2D91";
      return '<svg width="' + px + '" height="' + px + '" viewBox="0 0 96 96" aria-hidden="true">' +
        '<line x1="50" y1="48" x2="94" y2="48" stroke="' + ink + '" stroke-width="4" stroke-dasharray="7 6"/>' +
        '<line x1="24" y1="30" x2="84" y2="66" stroke="' + ink + '" stroke-width="9" stroke-linecap="round"/>' +
        '<line x1="24" y1="66" x2="84" y2="30" stroke="' + ink + '" stroke-width="9" stroke-linecap="round"/>' +
        '<circle cx="16" cy="24" r="11" fill="#FFFFFF" stroke="' + ink + '" stroke-width="7"/><circle cx="16" cy="72" r="11" fill="#FFFFFF" stroke="' + ink + '" stroke-width="7"/>' +
        '<circle cx="50" cy="48" r="3.5" fill="#FFFFFF"/></svg>';
    },
    register: function (px) {
      return '<svg width="' + px + '" height="' + px + '" viewBox="0 0 96 96" aria-hidden="true">' +
        '<polygon points="56,4 80,4 80,34 76,30 72,34 68,30 64,34 60,30 56,34" fill="#FFFFFF" stroke="#1B2530" stroke-width="3"/>' +
        '<rect x="61" y="10" width="14" height="3" fill="#1B2530"/><rect x="61" y="17" width="10" height="3" fill="#1B2530"/>' +
        '<rect x="14" y="20" width="36" height="20" rx="3" fill="#1B2530"/><rect x="19" y="25" width="26" height="10" fill="#F29A1F"/>' +
        '<path d="M12 40 H84 L90 70 H6 Z" fill="#F29A1F" stroke="#1B2530" stroke-width="3"/>' +
        '<circle cx="30" cy="50" r="3.5" fill="#1B2530"/><circle cx="42" cy="50" r="3.5" fill="#1B2530"/><circle cx="54" cy="50" r="3.5" fill="#1B2530"/><circle cx="66" cy="50" r="3.5" fill="#1B2530"/>' +
        '<circle cx="28" cy="60" r="3.5" fill="#1B2530"/><circle cx="41" cy="60" r="3.5" fill="#1B2530"/><circle cx="55" cy="60" r="3.5" fill="#1B2530"/><circle cx="68" cy="60" r="3.5" fill="#1B2530"/>' +
        '<rect x="4" y="70" width="88" height="20" rx="3" fill="#1B2530"/><rect x="38" y="78" width="20" height="4" rx="2" fill="#F29A1F"/></svg>';
    },
    surplus: function (px) {
      return '<svg width="' + px + '" height="' + px + '" viewBox="0 0 96 96" aria-hidden="true">' +
        '<rect x="6" y="14" width="84" height="68" fill="#D9A441" stroke="#3B2A0E" stroke-width="4"/>' +
        '<line x1="6" y1="36" x2="90" y2="36" stroke="#3B2A0E" stroke-width="3"/><line x1="6" y1="60" x2="90" y2="60" stroke="#3B2A0E" stroke-width="3"/>' +
        '<line x1="8" y1="80" x2="88" y2="16" stroke="#3B2A0E" stroke-width="5"/><rect x="6" y="84" width="84" height="6" fill="#D62828"/>' +
        '<circle cx="66" cy="34" r="15" fill="#FFFFFF" stroke="#D62828" stroke-width="4"/>' +
        '<text x="66" y="41" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="19" fill="#D62828">G</text></svg>';
    },
    codex: function (px) {
      return '<svg width="' + px + '" height="' + px + '" viewBox="0 0 96 96" aria-hidden="true">' +
        '<path d="M48 24 C38 14 20 12 6 16 V76 C20 72 38 74 48 84 Z" fill="#FFFFFF" stroke="#202122" stroke-width="4" stroke-linejoin="round"/>' +
        '<path d="M48 24 C58 14 76 12 90 16 V76 C76 72 58 74 48 84 Z" fill="#EAECF0" stroke="#202122" stroke-width="4" stroke-linejoin="round"/>' +
        '<path d="M14 30 C24 28 34 30 40 35 M14 42 C24 40 34 42 40 47 M14 54 C24 52 34 54 40 59" fill="none" stroke="#54595D" stroke-width="3" stroke-linecap="round"/>' +
        '<path d="M82 30 C72 28 62 30 56 35 M82 42 C72 40 62 42 56 47 M82 54 C72 52 62 54 56 59" fill="none" stroke="#54595D" stroke-width="3" stroke-linecap="round"/>' +
        '<polygon points="64,14 74,13 74,40 69,35 64,40" fill="#3366CC"/></svg>';
    }
  };
  function magpieImg(w, h) { return '<img src="img/sites/magpie-logo.png" width="' + w + '" height="' + h + '" alt="" draggable="false">'; }
  // the Codex's tag is part of its tagline: small, raised, link blue, italic inside square brackets
  var CITE = '<sup class="w98-cite">[<i>citation needed</i>]</sup>';

  /* ======================================================================== BANNERS (468 x 60) AND LINK BUTTONS (88 x 31)
     A banner or a button opens its site in Magpie, in the same tab (Back returns). */
  var BANNER = {
    magpie: function () {
      return magpieImg(70, 46) + '<span class="w98-ad-t"><b>Magpie</b><span>Finders keepers.</span></span><span class="w98-ad-cta">Ooh, shiny!</span>';
    },
    burnrate: function () {
      return '<span class="w98-ad-row">' + LOGO.burnrate(44) + '<b>Burn Rate</b><i>Know where it went.</i></span><span class="w98-ad-rule"></span>';
    },
    namedrop: function () {
      return LOGO.namedrop(72, 57) + '<span class="w98-ad-t"><b>NameDrop</b><span>Your name gets around.</span></span><span class="w98-ad-bar"></span>';
    },
    codex: function () {
      return LOGO.codex(46) + '<span class="w98-ad-t"><b>Codex</b><span>The Free Encyclopedia' + CITE + '</span></span><span class="w98-ad-hr"></span>';
    }
  };
  var BANNER_SITE = { magpie: "home", burnrate: "burnrate", namedrop: "namedrop", codex: "codex" };
  var BANNER_LABEL = { magpie: "Magpie: Finders keepers.", burnrate: "Burn Rate: Know where it went.", namedrop: "NameDrop: Your name gets around.", codex: "Codex: The Free Encyclopedia" };
  function banner(which) {
    if (!BANNER[which]) return null;
    var site = BANNER_SITE[which];
    return el("button.w98-ad-b.w98-ad-" + which, { type: "button", title: WEB.addr(site), "aria-label": BANNER_LABEL[which], html: BANNER[which](),
      onclick: function () { go(site); } });
  }
  var BUTTON = {
    magpie: function () { return magpieImg(34, 22) + '<span>Magpie</span>'; },
    burnrate: function () { return LOGO.burnrate(25) + '<span>Burn Rate</span>'; },
    undercut: function () { return LOGO.undercut(24) + '<span>undercut</span>'; },
    register: function () { return LOGO.register(25) + '<span>Register</span>'; },
    surplus: function () { return LOGO.surplus(25) + '<span>Surplus</span>'; },
    codex: function () { return LOGO.codex(25) + '<span>Codex</span>'; }
  };
  var BUTTON_SITE = { magpie: "home", burnrate: "burnrate", undercut: "undercut", register: "register", surplus: "surplus", codex: "codex" };
  function button88(which) {
    var site = BUTTON_SITE[which];
    if (site !== "home" && !WEB.open(site)) return null;   // a store the GM closed has no button
    return el("button.w98-88.w98-88-" + which, { type: "button", title: WEB.addr(site), "aria-label": site === "home" ? "Magpie" : SITES[site].title,
      html: BUTTON[which](), onclick: function () { go(site); } });
  }
  function ad(node) { return node ? el("div.w98-ad", null, [node]) : null; }

  /* ======================================================================== THE PARTS OF EACH SITE */
  function scrollToNode(n) { if (n && n.scrollIntoView) { try { n.scrollIntoView({ block: "start" }); } catch (e) { n.scrollIntoView(); } } }
  function sectionTitled(prefix) {
    var list = document.querySelectorAll("#view .section-title");
    for (var i = 0; i < list.length; i++) if (list[i].textContent.trim().toLowerCase().indexOf(prefix.toLowerCase()) === 0) return list[i];
    return null;
  }
  function wrap(cls, kids) { return el("div." + cls, null, [el("div.w98-s-in", null, kids)]); }

  // NameDrop: the blue header with Ledger and Contacts; the profile column with the portrait and the link buttons
  function faceTab(n) { var b = document.querySelectorAll("#view .face-bar > button"); if (b[n]) b[n].click(); }
  function faceOn() { var b = document.querySelectorAll("#view .face-bar > button"); for (var i = 0; i < b.length; i++) if (b[i].classList.contains("primary")) return i; return 0; }
  /* The profile picture is the record's headshot (identity.portrait), the same one the #PRINT badge wears: picked here,
     centre-cropped to 4:5 and shrunk by js/badge.js, kept on the record. A viewed or locked sheet cannot change it. */
  function readOnly(ch) {
    var S = EN.store;
    return !!((S.activeIsViewing && S.activeIsViewing()) || (ch.meta && S.isLocked && S.isLocked(ch.meta.id) && !(S.activeIsExample && S.activeIsExample())));
  }
  function picControls(ch) {
    var B = EN.badge;
    if (!B || !B.fromFile || readOnly(ch)) return { pick: null, row: null };
    var file = el("input", { type: "file", accept: "image/png,image/jpeg,image/webp", hidden: true, dataset: { ndPic: "file" },
      onchange: function () {
        var f = this.files && this.files[0]; this.value = "";
        if (!f) return;
        B.fromFile(f).then(function (url) { if (B.setPhoto(url)) EN.ui.toast("Picture saved to this record."); })
          .catch(function (err) { EN.ui.toast(err && err.message ? err.message : "That picture could not be used."); });
      } });
    var has = !!B.photo(ch);
    return {
      pick: function () { file.click(); },
      row: el("div.w98-nd-picrow", null, [file,
        el("button.w98-nd-picb", { type: "button", dataset: { ndPic: "pick" }, title: "Pick a picture: JPEG, PNG or WebP. It is cropped to a 4:5 portrait and kept on this record.",
          onclick: function () { file.click(); } }, has ? "Change picture" : "Add a picture"),
        has ? el("button.w98-nd-picb", { type: "button", dataset: { ndPic: "clear" }, onclick: function () { B.clearPhoto(); } }, "Remove") : null])
    };
  }
  function namedrop() {
    var ch = EN.store.active() || {}, pic = EN.badge && EN.badge.photo ? EN.badge.photo(ch) : (ch.identity && ch.identity.portrait), cur = faceOn();
    var pc = picControls(ch);
    var nav = el("nav.w98-nd-nav", { "aria-label": "Sections" }, ["Ledger", "Contacts"].map(function (t, i) {
      return el("button" + (i === cur ? ".w98-on" : ""), { type: "button", "aria-pressed": i === cur ? "true" : "false", onclick: function () { faceTab(i); } }, t);
    }));
    var name = ch.name || "No name on file";
    return {
      head: wrap("w98-s-head.w98-nd-head", [svg(LOGO.namedrop(74, 58)), el("div.w98-s-brand", null, [el("b", { text: "NameDrop" }), el("span", { text: "Your name gets around." })]), nav]),
      side: el("aside.w98-s-side.w98-nd-side", null, [
        el("section.w98-nd-card", null, [
          pc.pick
            ? el("button.w98-nd-pic", { type: "button", title: pic ? "Change the picture" : "Add a picture", "aria-label": pic ? "Change the picture" : "Add a picture", onclick: pc.pick },
                [pic ? el("img", { src: pic, alt: "" }) : el("span", { text: initials(name) }), pic ? null : el("i", { text: "Add a picture" })])
            : el("div.w98-nd-pic", null, [pic ? el("img", { src: pic, alt: "Portrait of " + name }) : el("span", { text: initials(name) })]),
          el("h2", { text: name }),
          pc.row
        ]),
        el("div.w98-nd-btns", null, ["magpie", "burnrate", "undercut", "register", "surplus", "codex"].map(button88))
      ]),
      foot: el("div.w98-s-foot.w98-nd-foot", null, [ad(banner("magpie"))])
    };
  }
  function initials(n) { return String(n || "?").replace(/["“”][^"“”]*["“”]/g, " ").split(/\s+/).filter(Boolean).slice(0, 2).map(function (w) { return w[0].toUpperCase(); }).join("") || "?"; }

  // Burn Rate: the navy header with its section links, the balance and what burns each week, Bills next, the six cards
  var BR_NAV = [["Lifestyle and Safehouse", "Lifestyle"], ["Leases", "Leases"], ["Hypercare", "Hypercare"], ["Licences and Papers", "Licences"], ["Debts", "Debts"], ["Glimmer and Nexus", "Ledger"]];
  function burnrate() {
    var I = inv(), S = I && I.billsSummary ? I.billsSummary() : null, fmtG = (I && I.core && I.core.fmtG) || function (n) { return "𝒢" + n; };
    var head = el("div.w98-s-head.w98-br-head", null, [el("div.w98-br-band", null, [
      el("div.w98-s-in", null, [svg(LOGO.burnrate(56)), el("div.w98-s-brand", null, [el("b", { text: "Burn Rate" }), el("i", { text: "Know where it went." })])]),
      el("div.w98-br-red"),
      el("nav.w98-br-nav", { "aria-label": "Sections" }, BR_NAV.map(function (p) {
        return el("button", { type: "button", onclick: function () { scrollToNode(sectionTitled(p[1])); } }, p[0]);
      }))
    ])]);
    var dash = S ? el("div.w98-br-dash", null, [
      el("section.w98-br-bal", null, [
        el("span.w98-br-amt", { text: fmtG(S.glimmer) }),
        el("span.w98-br-rule"),
        el("i", { text: "Burning " + fmtG(S.weekly) + " a week" })
      ]),
      el("section.w98-br-next", null, [el("h2", { text: "Bills next" })].concat(S.next.length ? S.next.map(function (b) {
        return el("div.w98-br-row" + (b.late ? ".w98-late" : ""), null, [el("span", { text: b.name }), el("span.w98-br-due", { text: b.due }), el("b", { text: b.amount })]);
      }) : [el("div.w98-br-row", null, [el("span", { text: "Nothing due." })])])),
      el("div.w98-br-cards", null, S.cards.map(function (c) { return el("section", null, [el("h2", { text: c.title }), el("span", { text: c.text })]); }))
    ]) : null;
    if (dash) head.appendChild(el("div.w98-s-in.w98-br-dashw", null, [dash]));
    return {
      head: head,
      foot: el("div.w98-s-foot.w98-br-foot", null, [
        el("div.w98-s-in", null, [el("p.w98-br-cancel", { text: "Cancellations are handled in person." }), ad(banner("namedrop"))]),
        el("footer.w98-s-bar", { text: "Glimmer is issued by #MINT." })
      ])
    };
  }

  // the storefronts: the market's own categories, read off the page that was just drawn
  function cats() {
    return Array.prototype.map.call(document.querySelectorAll("#view .mkt-cat"), function (p) {
      var h = p.querySelector(".panel-h h3");
      return { name: h ? h.textContent.trim() : "", panel: p };
    }).filter(function (c) { return c.name; });
  }
  function openCat(c) {
    var b = c.panel.querySelector(".panel-b"), h = c.panel.querySelector(".panel-h");
    if (h && (!b || !b.children.length)) h.click();
    setTimeout(function () {
      var again = cats().filter(function (x) { return x.name === c.name; })[0];
      scrollToNode(again ? again.panel : null);
    }, 0);
  }
  function catNav(cls, label, first) {
    var list = cats();
    return el("nav." + cls, { "aria-label": label }, (first ? [el("button.w98-on", { type: "button", onclick: function () { var w = K.winOf("t:web"); if (w && w.client) w.client.scrollTop = 0; } }, first)] : [])
      .concat(list.map(function (c) { return el("button", { type: "button", onclick: function () { openCat(c); } }, c.name); })));
  }
  function register() {
    return {
      head: el("div.w98-s-head.w98-rg-head", null, [
        el("div.w98-s-in", null, [
          el("div.w98-rg-top", null, [svg(LOGO.register(60)), el("div.w98-s-brand", null, [
            el("b", { text: "The Register" }),
            svg('<svg width="190" height="10" viewBox="0 0 190 10"><polyline points="0,2 10,8 20,2 30,8 40,2 50,8 60,2 70,8 80,2 90,8 100,2 110,8 120,2 130,8 140,2 150,8 160,2 170,8 180,2 190,8" fill="none" stroke="#F29A1F" stroke-width="3"/></svg>'),
            el("i", { text: "Thank you for shopping responsibly." })])]),
          catNav("w98-rg-dept", "Departments", "Welcome")
        ])
      ]),
      foot: el("div.w98-s-foot.w98-rg-foot", null, [el("div.w98-s-in", null, [ad(banner("burnrate"))]), el("footer.w98-s-bar", { text: "Fees are non-negotiable. All sales final." })])
    };
  }
  function surplus() {
    return {
      head: el("div.w98-s-head.w98-gs-head", null, [
        el("div.w98-s-in", null, [svg(LOGO.surplus(68)), el("div.w98-s-brand", null, [el("b", { text: "Guild Surplus" }), el("span.w98-gs-bar"), el("i", { text: "The dues pay for themselves. Mostly." })])]),
        el("div.w98-gs-aisles", { "aria-hidden": "true" }, [el("div.w98-s-in", null, ["Job lots", "Recovered cargo", "Overstock", "Salvage"].map(function (t) { return el("span", { text: t }); }))]),
        el("div.w98-s-in", null, [el("section.w98-gs-sign", null, [el("h2", { text: "Guild members only." }), el("b", { text: "Dues current? Dig in." })])])
      ]),
      foot: el("div.w98-s-foot.w98-gs-foot", null, [el("div.w98-s-in", null, [ad(banner("codex"))]), el("footer.w98-s-bar", { text: "Everything works, mostly. Everything runs about a third of book, roughly." })])
    };
  }
  // The Undercut's classifieds, and Five-Finger Supply in the same plain look in its own green until it has art
  function classifieds(site) {
    var ff = site === "fivefinger";
    return {
      side: el("aside.w98-s-side.w98-uc-side", null, [
        ff ? null : svg(LOGO.undercut(64)),
        el("b.w98-uc-name", { text: ff ? "five-finger supply" : "the undercut" }),
        el("i", { text: SITES[site].tag })
      ]),
      top: el("div.w98-s-top.w98-uc-top", null, [el("h1", { text: ff ? "left behind" : "elysium" })])
    };
  }
  // The Codex: the sidebar with the logo, its links and the tagline; the Article, Discussion and History tabs
  function codexHome() { var w = K.winOf("t:web"); if (w && w.client) w.client.scrollTop = 0; }
  function codexRandom() {
    var C = EN.codexView, ids = [];
    try { (C.chapters() || []).forEach(function (c) { (c.panels || []).forEach(function (p) { ids.push(p.id); }); }); } catch (e) {}
    if (ids.length && C.open) C.open(ids[Math.floor(Math.random() * ids.length)]);
  }
  function codex() {
    return {
      side: el("aside.w98-s-side.w98-cx-side", null, [
        svg(LOGO.codex(96)),
        el("b.w98-cx-name", { text: "Codex" }),
        el("span.w98-cx-tag", { html: "The Free Encyclopedia" + CITE }),
        el("nav.w98-cx-nav", { "aria-label": "Navigation" }, [
          el("button", { type: "button", onclick: codexHome }, "Main page"),
          el("button", { type: "button", onclick: function () { scrollToNode(document.querySelector("#view .cx-chaps")); } }, "Contents"),
          el("button", { type: "button", onclick: codexRandom }, "Random article")
        ])
      ]),
      top: el("div.w98-s-top.w98-cx-top", { "aria-hidden": "true" }, [el("span.w98-on", { text: "Article" }), el("span", { text: "Discussion" }), el("span", { text: "History" })])
    };
  }
  var PARTS = { namedrop: namedrop, burnrate: burnrate, register: register, surplus: surplus, undercut: function () { return classifieds("undercut"); },
                fivefinger: function () { return classifieds("fivefinger"); }, codex: codex };

  /* ======================================================================== PAINT: the parts around the page */
  var AREAS = ["side", "head", "top", "foot"];
  function clearParts(w) {
    if (!w._sp) return;
    AREAS.forEach(function (a) { var n = w._sp[a]; if (n && n.parentNode) n.parentNode.removeChild(n); });
    w._sp = null;
  }
  function seatParts(w) {
    var c = w.client, p = w._sp;
    if (!p) return;
    var page = c.querySelector(":scope > #view, :scope > .w98-snap");
    if (p.head && c.firstChild !== p.head) c.insertBefore(p.head, c.firstChild);
    if (p.side && p.side.parentNode !== c) c.insertBefore(p.side, page || null);
    if (p.top && p.top.parentNode !== c) c.insertBefore(p.top, page || null);
    if (p.foot && c.lastChild !== p.foot) c.appendChild(p.foot);
  }
  function paint() {
    var w = K.winOf("t:web");
    if (!w || !w.frame || !w.client) return;
    if (!on98fl()) { clearParts(w); delete w.frame.dataset.site; return; }
    var live = K.live() === "web", site = WEB.shown() || "home";
    if (live) {
      w.frame.dataset.site = site;
      clearParts(w);
      var make = PARTS[site];
      if (make) { try { w._sp = make(); } catch (e) { console.error("A Magpie site could not be dressed", e); w._sp = null; } }
      if (w._sp) AREAS.forEach(function (a) { if (w._sp[a]) w._sp[a].setAttribute("data-area", a); });
    }
    seatParts(w);
  }
  X.paint.push(paint);

  /* ======================================================================== THE STOREFRONTS' PRICE LINES (display only) */
  var SURCHARGE = { Licensed: "Licensed: surcharge applies", Restricted: "Restricted: surcharge applies", Contraband: "Contraband: surcharge applies" };
  function receiptRow(label, amt, cls) { return el("div" + (cls ? "." + cls : ""), null, [el("span", { text: label }), el("span", { text: amt })]); }
  if (inv() && inv().cardHooks) inv().cardHooks.push(function (it, ctx) {
    if (!on98fl() || !it || it.vendor === false) return null;
    var I = inv(), fmtG = I.core.fmtG;
    if (ctx.front === "register") {
      var r = I.registerReceipt ? I.registerReceipt(it) : null;
      var tag = r && r.surcharge && SURCHARGE[r.surcharge] ? el("span.w98-rg-tag", { text: SURCHARGE[r.surcharge] }) : null;
      if (!ctx.open || !r) return tag ? el("div.w98-rg-extra", null, [tag]) : null;
      return el("div.w98-rg-extra", null, [tag, el("div.w98-rcpt", { role: "table", "aria-label": "Receipt" }, [
        receiptRow("List price", fmtG(r.list)),
        receiptRow("Compliance handling", fmtG(r.compliance)),
        receiptRow("#PRINT verification", fmtG(r.print)),
        receiptRow("Licensing escrow", fmtG(r.escrow)),
        receiptRow("Scarcity-indexed pricing", fmtG(r.scarcity)),
        receiptRow(it.upkeep ? "Buy-in total" : "Total", fmtG(r.total), "w98-rcpt-t")
      ])]);
    }
    if (ctx.front === "surplus" && it.price > 0) return el("div.w98-gs-book", null, [el("span", { text: "Book: " + fmtG(it.price) }), el("span", { text: "Serial: worn off" })]);
    return null;
  });

  return { banner: banner, button88: button88, logo: LOGO };
})();
