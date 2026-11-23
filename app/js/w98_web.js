/* ===========================================================================
   ELYSIUM NIGHTS · #GRIDOS '98, THE #GRID BROWSER AND THE STASH SPREADSHEET (22 Nov 2026, the author's call)

   On the Freelancer desktop of '98 the network tab is My Smartdeck, and #GRID is a web browser: one window with tabs,
   Back and Forward, an address bar, a Links bar and a start page. Socials, Bills, The Undercut, The Register, Guild
   Surplus and the Codex are SITES in it: each is the app's own page, drawn by its own module exactly as on every other
   skin, only hosted in the browser's window (js/w98.js, WHERE A TAB IS HOSTED). The desktop's Socials and Codex icons
   open the same pages in the browser.

   The Stash opens on Gear, and its other pages (Chrome, the Workbench, the Garage) are worksheet tabs along the bottom of
   its window, the way a spreadsheet keeps its sheets. Bills and the storefronts are not in the Stash on '98: they are
   bookmarks of the browser.

   Every address is in-world (grid://...). Nothing here names, copies or links a real site. No em or en dashes anywhere
   in this file (house style).
   =========================================================================== */
window.EN = window.EN || {};

EN.w98web = (function () {
  var NONE = { render: function () {} };
  if (!EN.w98 || !EN.w98.kit || !EN.w98.ext) return NONE;
  var K = EN.w98.kit, X = EN.w98.ext, el = K.el;

  function fl() { return K.portal() === "freelancer"; }
  function inv() { return EN.inventoryView && EN.inventoryView.page ? EN.inventoryView : null; }
  function invPage() { var I = inv(); return I ? I.page() : { sub: "stash", front: "undercut" }; }
  var BROWSED = { bills: 1, market: 1 };   // the Stash pages that are sites on '98

  /* ======================================================================== THE SITES */
  /* The sites' names, taglines and 32 px icons are the designer's (23 Nov 2026, gridos-98-sites-handoff): Magpie is the
     browser, NameDrop the Social tab, Burn Rate the Bills page. `icon` is a file in img/sites-32 (the Codex keeps its
     Programs icon); `tile`, `ink` and `bg` draw the small lettered stand-in where no 16 px cut exists yet. */
  var SITES = {
    home:       { title: "Start", tab: "web" },
    namedrop:   { title: "NameDrop", tab: "face", tile: "N", ink: "#fff", bg: "#3D5A96", icon: "sites-32/namedrop-32.svg", tag: "Your name gets around." },
    burnrate:   { title: "Burn Rate", tab: "gear", sub: "bills", tile: "BR", ink: "#fff", bg: "#14295A", icon: "sites-32/burn-rate-32.svg", tag: "Know where it went." },
    undercut:   { title: "The Undercut", tab: "gear", sub: "market", front: "undercut", tile: "U", ink: "#fff", bg: "#5A2D91", icon: "sites-32/undercut-32.svg", tag: "Don't ask for a receipt." },
    register:   { title: "The Register", tab: "gear", sub: "market", front: "register", tile: "R", ink: "#1B2530", bg: "#F29A1F", icon: "sites-32/register-32.svg", tag: "Thank you for shopping responsibly." },
    surplus:    { title: "Guild Surplus", tab: "gear", sub: "market", front: "surplus", tile: "GS", ink: "#fff", bg: "#1D3FBF", icon: "sites-32/guild-surplus-32.svg", tag: "The dues pay for themselves. Mostly." },
    fivefinger: { title: "Five-Finger Supply", tab: "gear", sub: "market", front: "fivefinger", tile: "5", ink: "#fff", bg: "#2d7a3a", tag: "No receipts. No refunds. No snitching." },
    codex:      { title: "Codex", tab: "codex", tile: "C", ink: "#000", bg: "#f6f6f6", icon: "programs-32/codex-32.svg", tag: "The Free Encyclopedia" }
  };
  var LINKS = ["namedrop", "burnrate", "undercut", "register", "surplus", "fivefinger", "codex"];
  // the old addresses (and the names they had before the sites were named) still go where they went
  var ALIAS = { "": "home", newtab: "home", "new tab": "home", start: "home", socials: "namedrop", social: "namedrop", bills: "burnrate",
    "burn rate": "burnrate", "name drop": "namedrop", wiki: "codex", rules: "codex",
    "the undercut": "undercut", "the register": "register", "guild surplus": "surplus", "five-finger supply": "fivefinger", "five finger": "fivefinger" };
  var BROWSER = "Magpie";

  function addr(site) { return "grid://" + site; }
  function fronts() { var I = inv(); return I && I.fronts ? I.fronts().map(function (f) { return f.key; }) : ["undercut", "register", "surplus"]; }
  // a storefront the GM closed (or Five-Finger, while its control is off) is not on the net for this sheet
  function open(site) {
    var s = SITES[site];
    if (!s) return false;
    if (s.front) return fronts().indexOf(s.front) !== -1;
    return true;
  }
  function links() { return LINKS.filter(open); }
  // the site a tab is showing, or null when that tab (or that page of it) is not one
  function siteOf(tab) {
    if (tab === "web") return "home";
    if (tab === "face") return "namedrop";
    if (tab === "codex") return "codex";
    if (tab === "gear") {
      var p = invPage();
      if (p.sub === "bills") return "burnrate";
      if (p.sub === "market") return SITES[p.front] ? p.front : "undercut";
    }
    return null;
  }
  function liveSite() { try { return siteOf(EN.app.activeTab()); } catch (e) { return null; } }

  /* ======================================================================== HOSTING (js/w98.js) */
  X.host.push(function (k) { return fl() && siteOf(k) ? "web" : null; });
  X.relabel.grid = function () { return fl() ? "My Smartdeck" : null; };
  X.relabel.face = function () { return fl() ? "NameDrop" : null; };
  X.tile.grid = function (px) { return fl() ? K.pix("deck", px) : null; };
  // a site's 32 px icon, at 32 or a whole multiple of it only (never 40 or 48: the pixels would smear)
  function px32(file, px) { return '<img class="w98-px" src="img/' + file + '" width="' + px + '" height="' + px + '" alt="" draggable="false">'; }
  /* Magpie's icon and NameDrop's are the designer's 32 px art. Neither has a 16 px cut yet, and the 32 px files are never
     shrunk, so at 16 the browser keeps the small globe drawn here and NameDrop keeps the Social tab's own glyph. */
  var GLOBE16 = '<svg viewBox="0 0 16 16" width="16" height="16" shape-rendering="crispEdges" aria-hidden="true"><circle cx="8" cy="8" r="6.5" fill="#07090d"/>' +
    '<path d="M8 1.5v13M1.5 8h13M3 4.5h10M3 11.5h10" stroke="#a6ff4d" stroke-width="1" fill="none"/><ellipse cx="8" cy="8" rx="3" ry="6.5" stroke="#6aa82f" fill="none"/>' +
    '<circle cx="8" cy="8" r="6.5" stroke="#000" fill="none"/></svg>';
  X.tile.web = function (px) { return px >= 32 && px % 32 === 0 ? px32("sites-32/magpie-32.svg", px) : GLOBE16; };
  X.tile.face = function (px) { return fl() && px >= 32 && px % 32 === 0 ? px32(SITES.namedrop.icon, px) : null; };

  // what the desktop's icons open: a site in the browser, the browser as it was, the Stash on its Gear sheet
  var _siteNav = false;
  function go(site, opts) {
    var s = SITES[site];
    if (!s || !open(site)) { notFound(site); return false; }
    opts = opts || {};
    if (opts.from) K.from(opts.from);
    _siteNav = true;
    try {
      if (s.tab === "gear" && inv()) inv().setPage(s.sub, s.front);
      K.launch(s.tab);
    } finally { _siteNav = false; }
    return true;
  }
  function notFound(site) {
    K.dialog({ id: "web404", title: BROWSER, icon: "error",
      body: BROWSER + " cannot find " + addr(site || "") + ". The uplink may be closed, or the address is wrong. Check it and try again." });
  }
  X.icons.push(function (k) {
    if (!fl()) return null;
    if (k === "face") return function () { go("namedrop"); };
    if (k === "codex") return function () { go("codex"); };
    if (k === "web") return function () {
      var w = K.winOf("t:web");
      if (w && w.open && w.frame) { if (w.min) EN.w98.restore("t:web"); else EN.w98.focus("t:web"); return; }
      go("home");
    };
    return null;
  });
  // the Stash opens on Gear, or on the sheet its window was showing; never on a page that is a site
  X.prelaunch.push(function (k) {
    if (k !== "gear" || !fl() || _siteNav || !inv()) return;
    var w = K.winOf("t:gear");
    if (!w || !w.open || !w.frame) inv().setPage("stash");
    else if (BROWSED[invPage().sub]) inv().setPage(w.sheet || "stash");
  });
  X.wake.gear = function (w) {
    if (!fl() || !inv()) return false;
    inv().setPage(w.sheet || "stash");
    EN.app.gotoTab("gear");
  };
  X.wake.web = function (w) {
    if (!fl()) return false;
    var t = cur(w);
    go(t && t.hist[t.i] ? t.hist[t.i] : "home");
  };
  X.status.gear = function () { return fl() ? "Ready" : null; };
  // Run takes an address, the way that box opened a web page: grid://burnrate opens Burn Rate in the browser
  X.run.push(function (text) {
    if (!fl() || !/^grid:/i.test(String(text).trim())) return false;
    goTyped(text);
    return true;
  });
  X.title.web = function (w) {
    var site = shownSite(w);
    return siteTitle(site) + " - " + BROWSER;
  };

  /* ======================================================================== THE BROWSER'S TABS AND HISTORY
     Each tab keeps its own list of sites and a place in it. Whatever the browser's window shows is written into the tab in
     front when it changes, however it changed (a bookmark, a link inside a page, the Start menu), so Back always goes to
     the page before. Back, Forward and a tab switch move the place first, so the page they open is already there. */
  function cur(w) { return w && w.btabs ? w.btabs[w.bi] : null; }
  function shownSite(w) {
    if (K.live() === "web") return liveSite() || "home";
    var t = cur(w);
    return t && t.hist[t.i] ? t.hist[t.i] : "home";
  }
  function freshTabs(w) { w.btabs = [{ hist: [], i: -1 }]; w.bi = 0; }
  function back(w) { var t = cur(w); if (!t || t.i <= 0) return; t.i--; go(t.hist[t.i]); }
  function fwd(w) { var t = cur(w); if (!t || t.i >= t.hist.length - 1) return; t.i++; go(t.hist[t.i]); }
  function pickTab(w, n) {
    if (!w.btabs[n]) return;
    w.bi = n;
    var t = cur(w);
    go(t.hist[t.i] || "home");
  }
  function newTab(w) { w.btabs.push({ hist: [], i: -1 }); w.bi = w.btabs.length - 1; go("home"); }
  function closeTab(w, n) {
    if (w.btabs.length <= 1) { EN.w98.close("t:web"); return; }
    w.btabs.splice(n, 1);
    if (w.bi >= w.btabs.length || n < w.bi) w.bi = Math.max(0, w.bi - (n < w.bi ? 1 : 0));
    if (w.bi >= w.btabs.length) w.bi = w.btabs.length - 1;
    var t = cur(w);
    go(t.hist[t.i] || "home");
  }
  function typed(text) {
    var s = String(text || "").trim().toLowerCase().replace(/^grid:\/*/, "").replace(/^www\./, "").replace(/\/.*$/, "").replace(/\.(net|grid|com|org)$/, "");
    if (Object.prototype.hasOwnProperty.call(ALIAS, s)) s = ALIAS[s];
    if (SITES[s]) return s;
    var byTitle = Object.keys(SITES).filter(function (k) { return SITES[k].title.toLowerCase().replace(/[^a-z0-9]/g, "") === s.replace(/[^a-z0-9]/g, ""); })[0];
    return byTitle || null;
  }
  function goTyped(text) {
    var s = typed(text);
    if (s) { go(s); return; }
    // nothing there: the bar goes back to the page that is showing, under the error
    var w = K.winOf("t:web"); if (w && w._addr) { w._addr.value = addr(shownSite(w)); try { w._addr.blur(); } catch (e) {} }
    K.dialog({ id: "web404", title: BROWSER, icon: "error",
      body: BROWSER + " cannot find " + (String(text).indexOf("grid://") === 0 ? text : addr(String(text || "").trim())) + ". Check the address and try again." });
  }

  /* ======================================================================== THE BROWSER'S CHROME */
  function btn(cls, title, html, onclick) {
    return el("button.w98-web-b" + (cls ? "." + cls : ""), { type: "button", title: title, "aria-label": title, html: html, onclick: onclick });
  }
  var ARW_L = '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M2 8l6-6v4h6v4H8v4z" fill="currentColor"/></svg>';
  var ARW_R = '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M14 8l-6-6v4H2v4h6v4z" fill="currentColor"/></svg>';
  var RELOAD = '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M13 8a5 5 0 1 1-1.5-3.6" fill="none" stroke="currentColor" stroke-width="2"/><path d="M9 1h5v5z" fill="currentColor"/></svg>';
  var HOME = '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M8 1L1 8h2v6h4v-4h2v4h4V8h2z" fill="currentColor"/></svg>';
  function buildBrowser(w) {
    var tabs = el("div.w98-web-tabs", { role: "tablist", "aria-label": "Tabs" });
    var field = el("input.w98-field.w98-web-addr", { type: "text", spellcheck: "false", "aria-label": "Address",
      onkeydown: function (e) { if (e.key === "Enter") { e.preventDefault(); goTyped(field.value); field.blur(); } },
      onfocus: function () { try { field.select(); } catch (e) {} } });
    var nav = el("div.w98-web-nav", { role: "toolbar", "aria-label": "Navigation" }, [
      w._back = btn("", "Back", ARW_L, function () { back(w); }),
      w._fwd = btn("", "Forward", ARW_R, function () { fwd(w); }),
      btn("", "Refresh", RELOAD, function () { if (K.live() === "web") EN.app.render(); else K.wake("t:web"); }),
      btn("", "Home", HOME, function () { go("home"); }),
      el("span.w98-web-al", { text: "Address" }),
      field,
      el("button.w98-btn.w98-web-go", { type: "button", onclick: function () { goTyped(field.value); } }, "Go")
    ]);
    var lk = el("div.w98-web-links", { role: "toolbar", "aria-label": "Links" });
    var bar = el("div.w98-web", null, [tabs, nav, lk]);
    w.frame.insertBefore(bar, w.client);
    w.frame.classList.add("w98-webwin");
    w._tabs = tabs; w._addr = field; w._links = lk; w._lsig = ""; w._tsig = "";
    freshTabs(w);
  }
  function siteTitle(site) { return SITES[site] ? SITES[site].title : SITES.home.title; }
  function paintBrowser(w) {
    if (!w._tabs) return;
    var live = K.live() === "web";
    // write what is showing into the tab in front
    if (live) {
      var site = liveSite(), t = cur(w);
      if (site && t && t.hist[t.i] !== site) { t.hist = t.hist.slice(0, t.i + 1); t.hist.push(site); t.i = t.hist.length - 1; }
    }
    var shown = shownSite(w), tc = cur(w);
    w._back.disabled = !tc || tc.i <= 0;
    w._fwd.disabled = !tc || tc.i >= tc.hist.length - 1;
    if (document.activeElement !== w._addr) w._addr.value = addr(shown);
    // the tabs
    var tsig = w.bi + "|" + w.btabs.map(function (t) { return t.hist[t.i] || "home"; }).join(",");
    if (tsig !== w._tsig) {
      w._tsig = tsig;
      EN.ui.clear(w._tabs);
      w.btabs.forEach(function (t, n) {
        var s = t.hist[t.i] || "home", on = n === w.bi;
        w._tabs.appendChild(el("div.w98-web-tab" + (on ? ".w98-on" : ""), { role: "tab", "aria-selected": on ? "true" : "false", dataset: { site: s },
          onclick: function (e) { if (!e.target.closest(".w98-web-x")) pickTab(w, n); } }, [
          el("span.w98-web-ti", { html: s === "home" ? GLOBE16 : favicon(s, 16) }),
          el("span.w98-web-tt", { text: siteTitle(s) }),
          el("button.w98-web-x", { type: "button", title: "Close tab", "aria-label": "Close tab", text: "x", onclick: function () { closeTab(w, n); } })
        ]));
      });
      w._tabs.appendChild(el("button.w98-web-new", { type: "button", title: "New tab", "aria-label": "New tab", text: "+", onclick: function () { newTab(w); } }));
    }
    // the Links bar: the bookmarks this sheet can reach right now
    var due = inv() && inv().billsDue ? inv().billsDue() : false;
    var lsig = links().join(",") + "|" + due + "|" + shown;
    if (lsig !== w._lsig) {
      w._lsig = lsig;
      EN.ui.clear(w._links);
      w._links.appendChild(el("span.w98-web-ll", { text: "Links" }));
      links().forEach(function (s) {
        // Burn Rate's bookmark turns red while something is overdue; its stand-in mark keeps its own colours
        w._links.appendChild(el("button.w98-web-lk" + (s === shown ? ".w98-on" : "") + (s === "burnrate" && due ? ".w98-due" : ""), { type: "button", dataset: { link: s },
          title: addr(s) + (s === "burnrate" && due ? " (something is overdue)" : ""), onclick: function () { go(s); } },
          [el("span.w98-web-ti", { html: favicon(s, 16) }), document.createTextNode(siteTitle(s) + (s === "burnrate" && due ? " (!)" : ""))]));
      });
    }
  }
  // a site's mark: a lettered square in its colours, original (no site's logo)
  function favicon(site, px) {
    var s = SITES[site];
    if (!s || !s.tile) return GLOBE16;
    var fs = s.tile.length > 1 ? px * 0.5 : px * 0.7;
    return '<svg viewBox="0 0 ' + px + ' ' + px + '" width="' + px + '" height="' + px + '" aria-hidden="true"><rect x=".5" y=".5" width="' + (px - 1) + '" height="' + (px - 1) + '" rx="' + (px / 8) + '" fill="' + s.bg + '" stroke="rgba(0,0,0,.45)"/>' +
      '<text x="' + (px / 2) + '" y="' + (px * 0.72) + '" font-size="' + fs + '" font-weight="700" text-anchor="middle" fill="' + s.ink + '" font-family="Arial, Helvetica, sans-serif">' + s.tile + '</text></svg>';
  }

  /* ======================================================================== THE STASH'S WORKSHEETS */
  var COLS = "ABCDEFGHIJKL".split("");
  function buildSheet(w) {
    w.frame.classList.add("w98-xls");
    w._fx = el("div.w98-xls-fx", null, [el("span.w98-xls-nb", { text: "A1" }), el("span.w98-xls-f", { text: "fx" }), w._fxv = el("span.w98-xls-v")]);
    w._cols = el("div.w98-xls-cols", { "aria-hidden": "true" }, [el("span.w98-xls-c0")].concat(COLS.map(function (c) { return el("span", { text: c }); })));
    w.frame.insertBefore(w._fx, w.client);
    w.frame.insertBefore(w._cols, w.client);
    w._sheets = el("div.w98-xls-tabs", { role: "tablist", "aria-label": "Sheets" });
    w.frame.insertBefore(w._sheets, w.sb);
    w._ssig = "";
  }
  function paintSheet(w) {
    if (!w._sheets || !inv()) return;
    var live = K.live() === "gear";
    if (live) w.sheet = invPage().sub;
    var list = inv().sheets(), sheet = w.sheet || "stash";
    if (!list.some(function (s) { return s.key === sheet; })) sheet = "stash";
    var label = (list.filter(function (s) { return s.key === sheet; })[0] || list[0]).label;
    w._fxv.textContent = "=STASH(\"" + label + "\")";
    var sig = list.map(function (s) { return s.key; }).join(",") + "|" + sheet;
    if (sig === w._ssig) return;
    w._ssig = sig;
    EN.ui.clear(w._sheets);
    w._sheets.appendChild(el("span.w98-xls-arr", { "aria-hidden": "true", text: "◀ ▶" }));
    list.forEach(function (s) {
      var on = s.key === sheet;
      w._sheets.appendChild(el("button.w98-xls-tab" + (on ? ".w98-on" : ""), { type: "button", role: "tab", "aria-selected": on ? "true" : "false", dataset: { sheet: s.key },
        onclick: function () {
          w.sheet = s.key;
          inv().setPage(s.key);
          if (K.live() === "gear") EN.app.render(); else K.wake("t:gear");
        } }, s.label));
    });
  }

  X.frame.push(function (w) {
    if (!fl()) return;
    if (w.key === "web") buildBrowser(w);
    if (w.key === "gear") buildSheet(w);
  });
  X.paint.push(function () {
    if (!fl()) return;
    var b = K.winOf("t:web"); if (b && b.frame) paintBrowser(b);
    var g = K.winOf("t:gear"); if (g && g.frame) paintSheet(g);
  });

  /* ======================================================================== MAGPIE'S START PAGE (the web tab's view)
     The designer's board (23 Nov 2026): the clock, the logo and wordmark, the search, "Ooh, shiny!", six quick tiles with
     the sites' 32 px icons shown at 64, three counters, and Burn Rate's banner. The counters are for fun, not a record. */
  function blocked() { return Math.max(0, Math.floor((Date.now() / 1000 - 1700000000) / 37)); }
  function clockNow() {
    var d = new Date();
    return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
  }
  var TILES = ["namedrop", "burnrate", "undercut", "register", "surplus", "codex"];
  // "Ooh, shiny!": a store that is open to this sheet, or a page of the Codex, at random
  function shiny() {
    var pool = ["undercut", "register", "surplus"].filter(open).concat(["codex"]);
    var s = pool[Math.floor(Math.random() * pool.length)];
    if (s !== "codex") { go(s); return; }
    var C = EN.codexView, ids = [];
    try { (C.chapters() || []).forEach(function (c) { (c.panels || []).forEach(function (p) { ids.push(p.id); }); }); } catch (e) {}
    go("codex");
    if (ids.length && C.open) setTimeout(function () { C.open(ids[Math.floor(Math.random() * ids.length)]); }, 0);
  }
  function render(mount) {
    var q = el("input.w98-mp-q", { type: "text", id: "w98-mp-q", spellcheck: "false", "aria-label": "Search",
      onkeydown: function (e) { if (e.key === "Enter") { e.preventDefault(); search(q.value); } } });
    var n = blocked();
    var banner = EN.w98sites && EN.w98sites.banner ? EN.w98sites.banner("burnrate") : null;
    mount.appendChild(el("div.w98-ntp.w98-mp", null, [
      el("div.w98-mp-clock", { text: clockNow() }),
      el("div.w98-mp-brand", null, [
        el("img.w98-mp-logo", { src: "img/sites/magpie-logo.png", width: "202", height: "132", alt: "Magpie logo: a magpie with a coin in its beak", draggable: "false" }),
        el("div", null, [el("h1.w98-mp-word", { text: BROWSER }), el("p.w98-mp-tag", { text: "Finders keepers." })])
      ]),
      el("form.w98-mp-search", { role: "search", onsubmit: function (e) { e.preventDefault(); search(q.value); } }, [
        el("label.w98-sr", { "for": "w98-mp-q", text: "Search" }), q,
        el("button.w98-mp-go", { type: "submit" }, "Go"),
        el("button.w98-mp-shiny", { type: "button", onclick: shiny }, "Ooh, shiny!")
      ]),
      el("nav.w98-mp-tiles", { "aria-label": "Quick tiles" }, TILES.filter(open).map(function (s) {
        return el("button.w98-mp-tile", { type: "button", dataset: { site: s }, title: addr(s), onclick: function () { go(s); } }, [
          el("span.w98-mp-ic", { html: px32(SITES[s].icon, 64) }), el("span.w98-mp-nm", { text: SITES[s].title })
        ]);
      })),
      el("div.w98-mp-counts", null, [
        el("div", null, [el("b", { text: n.toLocaleString() }), el("span", { text: "Ads pecked" })]),
        el("div", null, [el("b", { text: Math.round(n / 7).toLocaleString() }), el("span", { text: "Trackers dropped" })]),
        el("div", null, [el("b", { text: Math.round(n / 900).toLocaleString() }), el("span", { text: "Shiny things kept" })])
      ]),
      banner ? el("div.w98-ad", null, [banner]) : null
    ]));
  }
  function search(text) {
    var t = String(text || "").trim();
    K.openApp("find");
    var f = K.winOf("a:find");
    if (f && f._inp) { f._inp.value = t; if (f._go) f._go(); }
  }
  setInterval(function () {
    var c = document.querySelector("#view .w98-mp-clock");
    if (c) { var t = clockNow(); if (c.textContent !== t) c.textContent = t; }
  }, 15000);

  return { render: render, go: go, sites: SITES, siteOf: siteOf, typed: typed, open: open, links: links, addr: addr, px32: px32,
           favicon: favicon, browser: BROWSER, shown: function () { var w = K.winOf("t:web"); return w ? shownSite(w) : null; }, search: search };
})();
