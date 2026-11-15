/* ===========================================================================
   ELYSIUM NIGHTS · #GRIDeck: the status bar (P1, 14 Nov 2026).
   What a Freelancer needs in sight on every screen: who they are and their level, Vitality and Wounds, the
   class resource, the conditions on them, and the wallet. In this phase it only READS; the damage and heal
   popover, the rest menu and search arrive with the next one.

   It lives in the top bar (header.os-topbar), which is already the page's pinned chrome, as #dk-hud. THE
   SKELETON IS BUILT ONCE AND PATCHED: js/app.js re-renders on every store change, a cloud sync included, and a
   bar rebuilt each time would drop whatever is being typed into it once it has inputs. paint() only writes
   text, widths and classes into nodes it keeps.

   Every number comes from the functions the Freelancer tab already uses (EN.engine.derive and
   EN.combatView.core.state), handed in by the shell as one reading per render. Nothing is worked out here.
   No em or en dashes anywhere in this file (house style).
   =========================================================================== */
window.EN = window.EN || {};
EN.deck = EN.deck || {};
EN.deck.hud = (function () {
  var el = EN.ui.el, clear = EN.ui.clear;
  var RING = 2 * Math.PI * 19;   // the level ring's circumference (r = 19 in a 44 box)
  var N = null;                  // the kept nodes

  function meter(cls, label) {
    var m = {};
    m.root = el("div.dk-meter." + cls, null, [
      el("div.dk-ml", null, [el("i", { text: label }), el("b", null, [m.vigor = el("span.dk-vg"), m.val = el("span"), m.max = el("em")])]),
      el("span.dk-track", null, [m.fill = el("span.dk-fill")])
    ]);
    return m;
  }
  function build() {
    var n = {};
    n.ring = el("span.dk-ring", { html: '<svg viewBox="0 0 44 44" aria-hidden="true"><circle class="dk-rt" cx="22" cy="22" r="19"/><circle class="dk-rp" cx="22" cy="22" r="19"/></svg>' });
    n.level = el("b"); n.ring.appendChild(n.level);
    n.arc = n.ring.querySelector(".dk-rp");
    n.arc.setAttribute("stroke-dasharray", RING.toFixed(1));
    n.idn = el("button.dk-idn", { type: "button", dataset: { dkHud: "identity" }, title: "Your record", onclick: function () { EN.app.gotoTab("print"); } },
      [n.ring, el("span.dk-idt", null, [n.name = el("b"), n.sub = el("span")])]);
    n.vit = meter("dk-vit", "Vitality");
    n.wd = meter("dk-wd", "Wounds");
    n.res = el("div.dk-res", null, [n.resName = el("i"), el("div.dk-pips", null, [n.pips = el("span.dk-pipset"), n.resVal = el("b")])]);
    n.conds = el("div.dk-conds", { dataset: { dkHud: "conditions" } });
    n.wallet = el("div.dk-wal", null, [el("i", { text: "Glimmer" }), n.glim = el("b")]);
    n.root = el("div#dk-hud.dk", { dataset: { dkHud: "bar" } }, [n.idn, n.vit.root, n.wd.root, n.res, n.conds, n.wallet]);
    return n;
  }
  function setMeter(m, cur, max, vigor, low) {
    m.vigor.textContent = vigor ? "+" + vigor + " " : "";
    m.val.textContent = String(cur);
    m.max.textContent = " / " + max;
    m.fill.style.width = (max > 0 ? Math.max(0, Math.min(100, 100 * cur / max)) : 0) + "%";
    m.fill.classList.toggle("dk-low", !!low);
  }
  function chip(text, kind) { return el("span.dk-chip" + (kind ? "." + kind : ""), { text: text }); }

  function paint(top, c) {
    if (!N) N = build();
    if (N.root.parentNode !== top) top.appendChild(N.root);
    var ch = c.ch, d = c.d, st = c.st;
    N.root.classList.toggle("dk-ro", !!c.readOnly);

    // who, and how far along
    N.name.textContent = ch.name || "Unnamed Freelancer";
    var cls = d && d.classInfo && d.classInfo.name, sub = d && d.subclassInfo && d.subclassInfo.name;
    N.sub.textContent = cls ? cls + (sub ? " · " + sub : "") : "No class yet";
    var level = (d && d.level) || ch.level || 1;
    N.level.textContent = String(level);
    var pct = 0;
    try {
      var onXp = EN.campaigns && EN.campaigns.usesXp ? EN.campaigns.usesXp(ch) : !!ch.useXp;
      var from = EN.rules.xpThresholds[level] || 0, to = d && d.xpForNext;
      if (onXp && to && to > from) pct = Math.max(0, Math.min(1, ((d.xp || 0) - from) / (to - from)));
    } catch (e) { pct = 0; }
    N.arc.setAttribute("stroke-dashoffset", (RING * (1 - pct)).toFixed(1));

    // the pools: only a record with a class has them
    var pools = !!(st && d);
    N.vit.root.hidden = N.wd.root.hidden = !pools;
    if (pools) {
      setMeter(N.vit, st.vit, st.vitMax, st.vigor, st.vitMax > 0 && st.vit <= st.vitMax / 2);
      setMeter(N.wd, st.wounds, st.woundsMax, 0, false);
    }

    // the class resource: the Reservoir for a Shaper, the class pool for everyone else
    var res = null;
    if (pools && d.flow) res = { name: "Flow Points", max: d.flow.max, cur: (ch.flow && ch.flow.current != null) ? EN.engine.clamp(ch.flow.current, 0, d.flow.max) : d.flow.max };
    else if (pools && d.resource) {
      var have = ch.resources && ch.resources.current ? ch.resources.current[d.resource.name] : null;
      res = { name: d.resource.name, max: d.resource.max, cur: have != null ? have : d.resource.max };
    }
    N.res.hidden = !res;
    if (res) {
      N.resName.textContent = res.name;
      N.resVal.textContent = res.max > 12 ? res.cur + " / " + res.max : String(res.cur);
      clear(N.pips);
      if (res.max <= 12) for (var i = 1; i <= res.max; i++) N.pips.appendChild(el("span.dk-pip" + (i <= res.cur ? ".on" : "")));
    }

    // what is on them: the states the pools put them in, then the conditions on the record
    clear(N.conds);
    if (pools) {
      if (st.dying) N.conds.appendChild(chip("Dying", "bad"));
      else if (st.stable) N.conds.appendChild(chip("Stable", "bad"));
      else if (st.critical) N.conds.appendChild(chip("Critical Condition", "bad"));
      if (st.bloodied) N.conds.appendChild(chip("Bloodied", "bad"));
    }
    (ch.conditions || []).forEach(function (name) {
      var lvl = (ch.conditionLevels || {})[name];
      N.conds.appendChild(chip(name + (lvl > 1 ? " " + lvl : ""), "warn"));
    });

    N.glim.textContent = String(Number(ch.glimmer) || 0);
  }
  function remove() { if (N && N.root.parentNode) N.root.parentNode.removeChild(N.root); }

  return { paint: paint, remove: remove };
})();
