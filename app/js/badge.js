/* ===========================================================================
   ELYSIUM NIGHTS · the #PRINT badge (16 Nov 2026, the author's concept art).
   The Freelancer's identity tag, drawn as SVG shapes alone (no foreignObject, no raster but the headshot) in one
   470 x 690 box, so it scales to whatever it is placed in: a rect, polygons, paths, text and, when the Freelancer
   has one, the headshot as an <image> clipped to its frame. It is drawn FROM THE RECORD each time it is asked for:
   the name, the class (Calling) and subclass (Profession), size, species, lineage and Caliber are read from the
   record and the engine's derive(), and the barcode is made from the record's id, so it is the same bars for the
   same Freelancer and a different set for another.
   Today it lives in the Record drawer that Classic's status rail opens (js/deck_record.js).

   THE HEADSHOT is ch.identity.portrait: a data URL of a JPEG, centre-cropped to the frame's 4:5 and shrunk to
   240 x 300 in the browser before it is stored (a few tens of KB), so it travels with the record to the cloud,
   to other devices, into an export and into the GM's view of the sheet. Only a data:image jpeg, png or webp is
   ever drawn (an imported file is untrusted, and a URL there would be a request to somebody else's server), and
   only a file of one of those three types is ever read.
   No em or en dashes anywhere in this file (house style).
   =========================================================================== */
window.EN = window.EN || {};
EN.badge = (function () {
  var NS = "http://www.w3.org/2000/svg", _n = 0;
  var PHOTO_RE = /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+\/]+=*$/;
  var MAX_PHOTO = 600000;                         // characters of data URL a record may carry and the badge will draw
  var MAX_FILE = 12 * 1024 * 1024;                // bytes of picture the browser will be asked to shrink
  var KINDS = { "image/jpeg": 1, "image/png": 1, "image/webp": 1 };
  var PW = 240, PH = 300;                         // the stored headshot, 4:5 as the badge's frame is
  var INK = "#1b1a2a";

  function s(tag, attrs, kids) {
    var n = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(function (k) { if (attrs[k] != null) n.setAttribute(k, String(attrs[k])); });
    (kids || []).forEach(function (k) { if (k) n.appendChild(k); });
    return n;
  }
  function txt(text, attrs) { var n = s("text", attrs); n.textContent = text; return n; }

  /* the headshot a record carries, or "" for none: anything that is not a small data:image of the three kinds is none */
  function photo(ch) {
    var p = ch && ch.identity && ch.identity.portrait;
    return typeof p === "string" && p.length <= MAX_PHOTO && PHOTO_RE.test(p) ? p : "";
  }

  /* The #PRINT icon: the same artwork the app's #PRINT tab wears (js/app.js), so a change to that icon is a change here. Its
     path data and box are read once from where the app keeps it, and nothing of it is copied into this file. */
  var _ico, FP_W = 148, FP_CY = 214;
  function printIcon() {
    if (_ico !== undefined) return _ico;
    _ico = null;
    try {
      var html = EN.app && EN.app.tabIcon && EN.app.tabIcon("print");
      var el = html ? new DOMParser().parseFromString(html, "image/svg+xml").documentElement : null;
      var vb = el && el.nodeName.toLowerCase() === "svg" ? (el.getAttribute("viewBox") || "").trim().split(/[\s,]+/).map(Number) : [];
      var ds = el ? Array.prototype.map.call(el.getElementsByTagName("path"), function (p) { return p.getAttribute("d"); }).filter(Boolean) : [];
      if (vb.length === 4 && vb[2] > 0 && vb[3] > 0 && ds.length) _ico = { w: vb[2], h: vb[3], d: ds };
    } catch (e) { _ico = null; }
    return _ico;
  }
  function plain(name) { return String(name == null ? "" : name).replace(/^the\s+/i, "").trim(); }
  /* what the badge says, read from the record: the same figures the status rail and the sheet read */
  function fields(ch, d) {
    d = d || {};
    return {
      name: (typeof ch.name === "string" && ch.name.trim()) || "Unnamed Freelancer",
      calling: plain(d.classInfo && d.classInfo.name),
      profession: plain(d.subclassInfo && d.subclassInfo.name),
      size: String(d.size || ""),
      species: String((d.speciesInfo && d.speciesInfo.name) || ""),
      lineage: String((d.lineageInfo && d.lineageInfo.name) || ""),
      caliber: d.caliber || 1
    };
  }

  // a text size that fits a width: shrunk to a floor, then squeezed to the width rather than left to run off the badge
  function fit(text, avail, max, min, cw) {
    var n = Math.max(1, String(text).length), w = cw || 0.5, size = Math.min(max, avail / (n * w)), force = false;
    if (size < min) { size = min; force = n * size * w > avail; }
    return { size: Math.round(size * 10) / 10, force: force };
  }
  function value(text, x, y, avail, max, min, anchor) {
    var f = fit(text, avail, max, min, 0.5), a = { x: x, y: y, "font-size": f.size, "font-weight": 500, fill: INK, "data-bd-v": "1" };
    if (anchor) a["text-anchor"] = anchor;
    if (f.force) { a.textLength = avail; a.lengthAdjust = "spacingAndGlyphs"; }
    return txt(text, a);
  }
  function hash(str) { var h = 2166136261; for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

  /* the barcode: a run of bars from a seeded generator, scaled to the width it has to fill, in one path */
  function bars(seed, x0, y0, w, h) {
    var state = hash(seed) || 1, widths = [1, 1, 2, 1, 3, 2, 1, 1], gaps = [1, 2, 1, 1, 2], list = [], total = 0, i = 0;
    function next() { state ^= state << 13; state >>>= 0; state ^= state >>> 17; state ^= state << 5; state >>>= 0; return state; }
    while (total < 150) {
      var bw = widths[next() % widths.length], gp = gaps[next() % gaps.length];
      list.push([total, bw]); total += bw + gp;
      if (++i > 400) break;
    }
    total -= gaps[0];
    var k = w / total, d = "";
    list.forEach(function (b) { d += "M" + (x0 + b[0] * k).toFixed(2) + " " + y0 + "h" + (b[1] * k).toFixed(2) + "v" + h + "h-" + (b[1] * k).toFixed(2) + "z"; });
    return { path: d, count: list.length };
  }

  /* svg(ch, d, opts): the badge as an <svg>, ready to put anywhere. opts.onPhoto makes the headshot frame a thing to press. */
  function svg(ch, d, opts) {
    opts = opts || {};
    var id = "bd" + (++_n), F = fields(ch, d), pic = photo(ch);
    var root = s("svg", { viewBox: "0 0 470 690", preserveAspectRatio: "xMidYMid meet", role: "img", "data-bd": "badge",
      "aria-label": "#PRINT badge: " + F.name + (F.calling ? ", " + F.calling : "") + ", Caliber " + F.caliber });
    root.style.fontFamily = "var(--disp), Rajdhani, 'Barlow Condensed', sans-serif";
    root.appendChild(s("title", {}, [])).textContent = "#PRINT badge: " + F.name;

    // gradients, the brushed-metal pattern and the two clips
    root.appendChild(s("defs", {}, [
      s("linearGradient", { id: id + "s", x1: 0, y1: 0, x2: 0, y2: 1 }, [s("stop", { offset: 0, "stop-color": "#e7e7f1" }), s("stop", { offset: 0.45, "stop-color": "#c8c8d9" }), s("stop", { offset: 1, "stop-color": "#dadae6" })]),
      s("linearGradient", { id: id + "d", x1: 0, y1: 0, x2: 0, y2: 1 }, [s("stop", { offset: 0, "stop-color": "#27263c" }), s("stop", { offset: 1, "stop-color": "#17162a" })]),
      s("pattern", { id: id + "b", width: 4, height: 4, patternUnits: "userSpaceOnUse" }, [
        s("rect", { x: 0, y: 1, width: 4, height: 1, fill: "#ffffff", opacity: 0.2 }), s("rect", { x: 0, y: 3, width: 4, height: 1, fill: "#000000", opacity: 0.05 })]),
      s("clipPath", { id: id + "c" }, [s("rect", { x: 0, y: 0, width: 470, height: 690, rx: 34 })]),
      s("clipPath", { id: id + "p" }, [s("rect", { x: 40, y: 118, width: 170, height: 216, rx: 10 })])
    ]));

    var g = s("g", { "clip-path": "url(#" + id + "c)" });
    root.appendChild(g);
    // the card: a dark head, a silver plate with a bevel
    g.appendChild(s("rect", { x: 0, y: 0, width: 470, height: 690, fill: "url(#" + id + "d)" }));
    g.appendChild(s("rect", { x: 0, y: 93, width: 470, height: 597, fill: "url(#" + id + "s)" }));
    g.appendChild(s("rect", { x: 0, y: 93, width: 470, height: 597, fill: "url(#" + id + "b)" }));
    g.appendChild(s("rect", { x: 9, y: 102, width: 452, height: 579, rx: 28, fill: "none", stroke: "#ffffff", "stroke-width": 2, opacity: 0.6 }));
    g.appendChild(s("rect", { x: 8, y: 101, width: 452, height: 579, rx: 28, fill: "none", stroke: "#9d9db4", "stroke-width": 2 }));

    // the head
    g.appendChild(txt("#PRINT", { x: 235, y: 58, "text-anchor": "middle", "font-size": 66, "font-weight": 700, fill: "#ffffff" }));
    g.appendChild(txt("Personal Record & Identity Network Tag", { x: 235, y: 86, "text-anchor": "middle", "font-size": 22.5, "font-weight": 600, "font-style": "italic", fill: "#ffffff", textLength: 436, lengthAdjust: "spacingAndGlyphs" }));

    // the headshot's frame, and the headshot or its place-holder
    var frame = s("g", { "data-bd": "photo" });
    frame.appendChild(s("rect", { x: 34, y: 112, width: 182, height: 228, rx: 14, fill: "#c1c1d2", stroke: "#9a9ab1", "stroke-width": 2 }));
    frame.appendChild(s("rect", { x: 40, y: 118, width: 170, height: 216, rx: 10, fill: "#d2d2df" }));
    if (pic) {
      frame.appendChild(s("image", { href: pic, x: 40, y: 118, width: 170, height: 216, preserveAspectRatio: "xMidYMid slice", "clip-path": "url(#" + id + "p)", "data-bd": "headshot" }));
    } else {
      frame.appendChild(txt("Image", { x: 125, y: 214, "text-anchor": "middle", "font-size": 44, "font-weight": 700, "font-style": "italic", fill: INK, "data-bd": "placeholder" }));
      frame.appendChild(txt("Here", { x: 125, y: 262, "text-anchor": "middle", "font-size": 44, "font-weight": 700, "font-style": "italic", fill: INK }));
    }
    frame.appendChild(s("rect", { x: 40, y: 118, width: 170, height: 216, rx: 10, fill: "none", stroke: "#ffffff", "stroke-width": 1.5, opacity: 0.55 }));
    if (typeof opts.onPhoto === "function") {
      var hit = s("rect", { x: 34, y: 112, width: 182, height: 228, rx: 14, fill: "transparent", "data-bd": "photo-hit", tabindex: 0, role: "button",
        "aria-label": pic ? "Replace the headshot" : "Add a headshot" }, [s("title", {})]);
      hit.firstChild.textContent = pic ? "Replace the headshot" : "Add a headshot";
      hit.style.cursor = "pointer";
      hit.addEventListener("click", opts.onPhoto);
      hit.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); opts.onPhoto(); } });
      frame.appendChild(hit);
    }
    g.appendChild(frame);

    // Caliber: a dark panel with a cut corner, brackets, a fingerprint and the figure
    g.appendChild(s("polygon", { points: "243,93 470,93 470,338 268,338 243,313", fill: "url(#" + id + "d)" }));
    var br = ["M273 144V116H301", "M402 116H430V144", "M273 278V306H301", "M402 306H430V278"];
    br.forEach(function (p) { g.appendChild(s("path", { d: p, fill: "none", stroke: "#ffffff", "stroke-width": 4, "stroke-linecap": "square" })); });
    // the fingerprint is the app's own #PRINT icon (the author's artwork), fitted inside the brackets and centred on the figure
    var ico = printIcon();
    if (ico) {
      var k = FP_W / ico.w, finger = s("g", { transform: "translate(" + (352 - ico.w * k / 2).toFixed(2) + " " + (FP_CY - ico.h * k / 2).toFixed(2) + ") scale(" + k.toFixed(4) + ")",
        fill: "#ffffff", opacity: 0.55, "data-bd": "fingerprint" });
      ico.d.forEach(function (d) { finger.appendChild(s("path", { d: d })); });
      g.appendChild(finger);
    }
    g.appendChild(txt("Caliber", { x: 352, y: 160, "text-anchor": "middle", "font-size": 38, "font-weight": 700, fill: "#ffffff" }));
    g.appendChild(txt(String(F.caliber), { x: 352, y: 292, "text-anchor": "middle", "font-size": 150, "font-weight": 800, fill: "#ffffff", stroke: "#000000", "stroke-width": 4,
      "paint-order": "stroke", "stroke-linejoin": "round", "data-bd": "caliber" }));

    // the fields: a label, the value over a rule
    function rule(x1, x2, y) { g.appendChild(s("line", { x1: x1, x2: x2, y1: y, y2: y, stroke: INK, "stroke-width": 1.5 })); }
    function label(text, x, y) { g.appendChild(txt(text, { x: x, y: y, "font-size": 17, "font-weight": 500, "font-style": "italic", fill: INK })); }
    label("Name:", 34, 399);
    var vn = value(F.name, 34, 440, 402, 38, 16); vn.setAttribute("data-bd-v", "name"); g.appendChild(vn); rule(34, 436, 446);
    label("Calling:", 34, 466); label("Profession:", 234, 466);
    var vc = value(F.calling, 34, 492, 182, 29, 14); vc.setAttribute("data-bd-v", "calling"); g.appendChild(vc); rule(34, 216, 498);
    var vp = value(F.profession, 234, 492, 202, 29, 14); vp.setAttribute("data-bd-v", "profession"); g.appendChild(vp); rule(234, 436, 498);
    label("Size:", 34, 520); label("Species:", 170, 520); label("Lineage:", 314, 520);
    var vs = value(F.size, 34, 546, 120, 25, 13); vs.setAttribute("data-bd-v", "size"); g.appendChild(vs); rule(34, 154, 552);
    var vsp = value(F.species, 170, 546, 128, 25, 13); vsp.setAttribute("data-bd-v", "species"); g.appendChild(vsp); rule(170, 298, 552);
    var vl = value(F.lineage, 314, 546, 122, 25, 13); vl.setAttribute("data-bd-v", "lineage"); g.appendChild(vl); rule(314, 436, 552);
    g.appendChild(txt("Freelancer", { x: 235, y: 593, "text-anchor": "middle", "font-size": 54, "font-weight": 700, fill: "#000000" }));
    rule(34, 436, 600);

    // the barcode, from the record's own id
    var bc = bars(String((ch.meta && ch.meta.id) || F.name), 34, 612, 402, 52);
    g.appendChild(s("path", { d: bc.path, fill: "#000000", "data-bd": "barcode", "data-bars": bc.count }));
    return root;
  }

  /* fromFile(file): a picture picked by the player, as the headshot the record will keep: centre-cropped to 4:5, shrunk to 240 x 300, JPEG. */
  function fromFile(file) {
    return new Promise(function (resolve, reject) {
      if (!file || !KINDS[String(file.type).toLowerCase()]) { reject(new Error("That is not a JPEG, PNG or WebP picture.")); return; }
      if (file.size > MAX_FILE) { reject(new Error("That picture is too large. Pick one under 12 MB.")); return; }
      var url = null, img = new Image();
      function done() { try { if (url) URL.revokeObjectURL(url); } catch (e) {} }
      img.onload = function () {
        try {
          var w = img.naturalWidth, h = img.naturalHeight;
          if (!(w > 0 && h > 0)) throw new Error("empty");
          var want = PW / PH, sw = w, sh = h;
          if (w / h > want) sw = Math.round(h * want); else sh = Math.round(w / want);
          var c = document.createElement("canvas"); c.width = PW; c.height = PH;
          var cx = c.getContext("2d");
          cx.fillStyle = "#d2d2df"; cx.fillRect(0, 0, PW, PH);   // a transparent PNG sits on the frame's own ground
          cx.drawImage(img, Math.round((w - sw) / 2), Math.round((h - sh) / 2), sw, sh, 0, 0, PW, PH);
          var out = c.toDataURL("image/jpeg", 0.85);
          done();
          if (!PHOTO_RE.test(out) || out.length > MAX_PHOTO) reject(new Error("That picture could not be shrunk enough.")); else resolve(out);
        } catch (e) { done(); reject(new Error("That picture could not be read.")); }
      };
      img.onerror = function () { done(); reject(new Error("That picture could not be read.")); };
      try { url = URL.createObjectURL(file); img.src = url; } catch (e) { reject(new Error("That picture could not be read.")); }
    });
  }
  function setPhoto(url) {
    if (!PHOTO_RE.test(String(url || "")) || url.length > MAX_PHOTO) return false;
    EN.store.update(function (c) { c.identity = c.identity || {}; c.identity.portrait = url; });
    return true;
  }
  function clearPhoto() { EN.store.update(function (c) { if (c.identity) delete c.identity.portrait; }); }

  return { svg: svg, photo: photo, fields: fields, fromFile: fromFile, setPhoto: setPhoto, clearPhoto: clearPhoto, size: { w: PW, h: PH } };
})();
