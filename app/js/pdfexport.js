/* ===========================================================================
   ELYSIUM NIGHTS - Fillable PDF export ("Freelancer Field Dossier", editable)
   Builds a real AcroForm PDF via the vendored pdf-lib, pre-filled from
   EN.engine.derive(ch) but editable in any PDF reader. Mirrors the pages of
   EN.printSheet, laid out fresh in PDF coordinates (a clean on-brand form)
   rather than copying the on-screen CSS pixel-for-pixel.
   =========================================================================== */
window.EN = window.EN || {};

EN.pdfExport = (function () {
  var toast = EN.ui.toast;
  var PDFLib = window.PDFLib;

  /* ---- print-brand palette, translated from css/print.css's paper theme -- */
  var COLOR_HEX = {
    ink:    [0x18, 0x22, 0x2c],
    muted:  [0x6a, 0x74, 0x7b],
    dim:    [0x8a, 0x90, 0x97],
    accent: [0x0c, 0x6f, 0x81],
    ember:  [0xb1, 0x48, 0x1f],
    rule:   [0xcf, 0xc8, 0xb7],
    field:  [0x3a, 0x46, 0x50]
  };
  function hexColor(key) { var c = COLOR_HEX[key]; return PDFLib.rgb(c[0] / 255, c[1] / 255, c[2] / 255); }
  var WHITE = PDFLib.rgb(1, 1, 1);

  var PAGE_W = 612, PAGE_H = 792;   // US Letter, points
  var MARGIN = { left: 40, right: 40, top: 46, bottom: 34 };
  var CONTENT_W = PAGE_W - MARGIN.left - MARGIN.right;

  // word-wrap plain drawText() calls to a max width; drawText itself never
  // wraps, it just draws past the page edge, so any unbounded caller (an
  // ability's brief text, a long proficiency line) needs this before it ships.
  function wrapLines(font, text, size, maxWidth) {
    var words = String(text == null ? "" : text).split(/\s+/).filter(Boolean);
    if (!words.length) return [""];
    var lines = [], cur = "";
    words.forEach(function (w) {
      var test = cur ? cur + " " + w : w;
      if (cur && font.widthOfTextAtSize(test, size) > maxWidth) { lines.push(cur); cur = w; }
      else cur = test;
    });
    if (cur) lines.push(cur);
    return lines;
  }

  // The standard fonts encode WinAnsi (Windows-1252) only. A field's setText()
  // does not validate, but doc.save() throws deep inside appearance-stream
  // generation the moment it hits an unencodable character, failing the WHOLE
  // multi-page document over one bad character in any single free-text field
  // (a pasted emoji, a CJK name). Strip anything outside WinAnsi before it
  // ever reaches setText, so one character can't take down the whole build.
  var WINANSI_SPECIAL = {
    0x20AC: 1, 0x201A: 1, 0x0192: 1, 0x201E: 1, 0x2026: 1, 0x2020: 1, 0x2021: 1, 0x02C6: 1, 0x2030: 1,
    0x0160: 1, 0x2039: 1, 0x0152: 1, 0x017D: 1, 0x2018: 1, 0x2019: 1, 0x201C: 1, 0x201D: 1, 0x2022: 1,
    0x2013: 1, 0x2014: 1, 0x02DC: 1, 0x2122: 1, 0x0161: 1, 0x203A: 1, 0x0153: 1, 0x017E: 1, 0x0178: 1
  };
  function isWinAnsiChar(code) {
    if (code === 0x0A || code === 0x0D || code === 0x09) return true;   // newline / CR / tab
    if (code >= 0x20 && code <= 0x7E) return true;                     // ASCII printable
    if (code >= 0xA0 && code <= 0xFF) return true;                     // Latin-1 supplement
    return !!WINANSI_SPECIAL[code];
  }
  /* TRANSLITERATE BEFORE FILTERING, or a meaningful character is silently deleted.
     The filter above exists so one unencodable character cannot fail the whole document,
     and it was doing that job correctly and destructively: the Glimmer mark is U+1D4A2
     MATHEMATICAL SCRIPT CAPITAL G and the Nexus mark is U+25CE BULLSEYE, neither of them
     WinAnsi, so EVERY price in an exported PDF printed as a bare number with no currency
     mark at all. A player reading "60" cannot tell Glimmer from Nexus, and those are not
     interchangeable.

     The standard 14 PDF fonts are WinAnsi-only and fontkit is not vendored, so the real
     glyph cannot be embedded here. What prints instead is the book's own CURRENCY CODE,
     the notation a real currency uses when the sign is unavailable, exactly as USD stands
     in for $: "GLM 1,234.56" and "NXT 421.88". These are the manuscript's codes, not an
     abbreviation invented here. On screen nothing changes, because the app draws both
     marks as outlines and never needs a substitute (see EN.ui.substituteCurrencyGlyphs).

     THE SPACE IS THE WHOLE DIFFICULTY, and it is why this is a scanner and not the flat
     character map it replaced. Each mark does two jobs in the source text:

         a PRICE PREFIX, bound to a figure    "<G>100"          wants  "GLM 100"
         a NOUN, naming the currency itself   "Nexus Tokens (<N>)"  wants  "(NXT)"

     Both appear in the catalog, roughly 31 of the first and 26 of the second. A map that
     substituted "GLM " would punctuate every price correctly and leave a trailing space
     inside every parenthesis; a map that substituted "GLM" would get the nouns right and
     print "GLM100". So the space is emitted only when a figure actually follows, and an
     existing space is consumed rather than doubled, which keeps "<N> 500" from becoming
     "NXT  500". */
  var PDF_CURRENCY = Object.create(null);
  PDF_CURRENCY[String.fromCodePoint(0x1D4A2)] = "GLM";   // Glimmer, issued by the Luster Interchange Treasury
  PDF_CURRENCY[String.fromCodePoint(0x25CE)]  = "NXT";   // Nexus Tokens, ledger-only on Data Pillars
  function sanitizeText(s) {
    if (s == null) return s;
    var chars = Array.from(String(s)), out = [];
    for (var i = 0; i < chars.length; i++) {
      var ch = chars[i], code = PDF_CURRENCY[ch];
      if (code) {
        out.push(code);
        var j = i + 1;
        if (chars[j] === " " || chars[j] === "\u00A0") j++;          // do not double a space already there
        if (j < chars.length && chars[j] >= "0" && chars[j] <= "9") { out.push(" "); i = j - 1; }
        continue;
      }
      if (isWinAnsiChar(ch.codePointAt(0))) out.push(ch);
    }
    return out.join("");
  }

  /* A wallet figure, grouped and pinned to en-US so the printed sheet matches the book's
     own examples whatever locale the exporting machine runs in: a German default would
     otherwise render 1.234,56 and disagree with every price in the manuscript.

     Fractions print at exactly two places or not at all. The book subdivides Glimmer twice
     by a hundred (100 Flickers to a Gleam, 100 Gleams to a Glow), so two places is the
     currency's own precision, while a whole balance stays "GLM 1,234" rather than padding
     every catalog-priced purse with a meaningless ".00". */
  function money(v) {
    var n = Number(v);
    if (!isFinite(n)) n = 0;
    return n % 1
      ? n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : n.toLocaleString("en-US", { maximumFractionDigits: 0 });
  }

  function safeSetText(tf, val) {
    if (val != null && val !== "") tf.setText(sanitizeText(String(val)));
  }

  /* =======================================================================
     Layout toolkit: a coordinate-cursor wrapper around a pdf-lib PDFDocument.
     One Ctx per logical dossier section (Front Sheet, Talents & Lineage, ...);
     flows across as many physical PDF pages as its content needs, repeating a
     slim continuation header. Every field name is namespaced under the Ctx's
     fieldPrefix so the same logical field (e.g. "notes") can appear on more
     than one section without colliding in the PDF's flat AcroForm namespace.
     ======================================================================= */
  function makeCtx(doc, form, fonts, opts) {
    var ctx = {
      title: opts.title, tag: opts.tag, serial: opts.serial,
      fieldPrefix: opts.fieldPrefix,
      page: null, y: 0, pageIndex: 0
    };

    // a fixed 11px bar/gap repeat lifted from .ps-barcode's CSS gradient; purely decorative
    function drawBarcode(x, y, w) {
      var cycle = [[0, 1], [1, 3], [3, 4], [4, 7], [7, 9], [9, 11]];
      var cx = x;
      while (cx < x + w) {
        for (var i = 0; i < cycle.length; i += 2) {
          var bx = cx + cycle[i][0], bw = cycle[i][1] - cycle[i][0];
          if (bx >= x + w) break;
          ctx.page.drawRectangle({ x: bx, y: y, width: Math.min(bw, x + w - bx), height: 12, color: hexColor("ink") });
        }
        cx += 11;
      }
    }
    function drawCorners(page) {
      var len = 10, x0 = MARGIN.left - 8, x1 = PAGE_W - MARGIN.right + 8, y0 = MARGIN.bottom - 10, y1 = PAGE_H - MARGIN.top + 26;
      var c = hexColor("rule");
      function bracket(cx, cy, dx, dy) {
        page.drawLine({ start: { x: cx, y: cy }, end: { x: cx + dx * len, y: cy }, thickness: 1, color: c });
        page.drawLine({ start: { x: cx, y: cy }, end: { x: cx, y: cy + dy * len }, thickness: 1, color: c });
      }
      bracket(x0, y1, 1, -1); bracket(x1, y1, -1, -1);
      bracket(x0, y0, 1, 1); bracket(x1, y0, -1, 1);
    }
    function drawFooter(page, pageLabel) {
      page.drawText("UNAUTHORIZED EDITS ARE LOGGED AND PROSECUTED  //  LUSTER INTERCHANGE TREASURY", {
        x: MARGIN.left, y: 20, size: 6.5, font: fonts.mono, color: hexColor("dim")
      });
      var w = fonts.mono.widthOfTextAtSize(pageLabel, 6.5);
      page.drawText(pageLabel, { x: PAGE_W - MARGIN.right - w, y: 20, size: 6.5, font: fonts.mono, color: hexColor("dim") });
    }

    function newPage() {
      ctx.pageIndex++;
      ctx.page = doc.addPage([PAGE_W, PAGE_H]);
      drawCorners(ctx.page);
      drawFooter(ctx.page, ctx.tag + (ctx.pageIndex > 1 ? "." + ctx.pageIndex : ""));
      var top = PAGE_H - MARGIN.top;
      if (ctx.pageIndex === 1) {
        ctx.page.drawText("ELYSIUM NIGHTS", { x: MARGIN.left, y: top + 22, size: 7.5, font: fonts.mono, color: hexColor("muted") });
        ctx.page.drawText(ctx.title, { x: MARGIN.left, y: top + 7, size: 17, font: fonts.bold, color: hexColor("ink") });
        drawBarcode(PAGE_W - MARGIN.right - 150, top + 21, 150);
        var idLine = "#PRINT   " + ctx.serial + "   " + ctx.tag;
        var idW = fonts.mono.widthOfTextAtSize(idLine, 8);
        ctx.page.drawText(idLine, { x: PAGE_W - MARGIN.right - idW, y: top + 7, size: 8, font: fonts.mono, color: hexColor("accent") });
        ctx.page.drawLine({ start: { x: MARGIN.left, y: top - 6 }, end: { x: PAGE_W - MARGIN.right, y: top - 6 }, thickness: 1.2, color: hexColor("accent") });
        ctx.y = top - 20;
      } else {
        ctx.page.drawText(ctx.title + "   (continued)", { x: MARGIN.left, y: top + 6, size: 10, font: fonts.bold, color: hexColor("muted") });
        ctx.page.drawLine({ start: { x: MARGIN.left, y: top - 3 }, end: { x: PAGE_W - MARGIN.right, y: top - 3 }, thickness: 0.75, color: hexColor("rule") });
        ctx.y = top - 16;
      }
    }
    newPage();

    ctx.ensure = function (h) { if (ctx.y - h < MARGIN.bottom) newPage(); };
    ctx.field = function (name) { return ctx.fieldPrefix + "." + name; };

    ctx.sectionTitle = function (title, right) {
      ctx.ensure(18);
      ctx.page.drawRectangle({ x: MARGIN.left, y: ctx.y - 11, width: 2.2, height: 10, color: hexColor("accent") });
      ctx.page.drawText(title.toUpperCase(), { x: MARGIN.left + 8, y: ctx.y - 9, size: 8.5, font: fonts.mono, color: hexColor("accent") });
      if (right) {
        var w = fonts.mono.widthOfTextAtSize(right, 7.5);
        ctx.page.drawText(right, { x: PAGE_W - MARGIN.right - w, y: ctx.y - 9, size: 7.5, font: fonts.mono, color: hexColor("dim") });
      }
      ctx.y -= 16;
    };

    ctx.rule = function () {
      ctx.ensure(8);
      ctx.page.drawLine({ start: { x: MARGIN.left, y: ctx.y }, end: { x: PAGE_W - MARGIN.right, y: ctx.y }, thickness: 0.5, color: hexColor("rule") });
      ctx.y -= 8;
    };

    ctx.spacer = function (h) { ctx.y -= h; };

    // wraps to (CONTENT_W - x) by default, or opts.maxWidth; pass wrap:false for
    // a caller that already guarantees a short string (e.g. a table cell).
    ctx.text = function (str, opts) {
      opts = opts || {};
      var size = opts.size || 9, font = opts.font || fonts.sans, h = opts.h || (size + 4);
      var maxW = opts.maxWidth || (CONTENT_W - (opts.x || 0));
      /* SANITIZE HERE, BEFORE WRAPPING, AND NOT AT THE drawText CALL.

         This is the prose primitive: talent text, briefs, inventory detail, every line
         that is drawn rather than parked in a form field. row() and table() each sanitize
         their own value, but this one passed its string straight through, so a catalog
         price reaching it handed drawText a raw U+1D4A2 and pdf-lib threw "WinAnsi cannot
         encode". download() catches everything and reports only "Fillable PDF failed to
         generate", so such an export did not lose the mark quietly, it died quietly.

         Before wrapping, because the substitution is WIDER than what it replaces (one
         character becomes "GLM "), so wrapLines has to measure the text that will really
         be drawn or the last word on a line runs past the column. wrapLines would throw on
         the raw mark regardless: widthOfTextAtSize encodes in order to measure. */
      str = sanitizeText(String(str == null ? "" : str));
      var lines = opts.wrap === false ? [str] : wrapLines(font, str, size, maxW);
      ctx.ensure(h * lines.length);
      lines.forEach(function (ln) {
        ctx.page.drawText(ln, { x: MARGIN.left + (opts.x || 0), y: ctx.y - size, size: size, font: font, color: opts.color || hexColor("ink") });
        ctx.y -= h;
      });
    };

    /* row(cells): cells=[{label,name,value,w,type:'static'|undefined,size,align,font,color,sub}]
       w is a flex weight (number, default 1) OR a fixed width string like "60px".
       sub, if given, is a small caption drawn under the box (e.g. a stat's attribute name). */
    ctx.row = function (cells, opts) {
      opts = opts || {};
      var boxH = opts.height || 16;
      var hasLabels = cells.some(function (c) { return c.label; });
      var hasSub = cells.some(function (c) { return c.sub; });
      var rowH = (hasLabels ? 11 : 0) + boxH + (hasSub ? 9 : 0);
      ctx.ensure(rowH + 6);
      var fixed = 0, flexSum = 0;
      cells.forEach(function (c) {
        if (typeof c.w === "string") fixed += parseFloat(c.w); else flexSum += (c.w || 1);
      });
      var gap = 6, totalGap = gap * (cells.length - 1);
      var flexW = Math.max(0, CONTENT_W - fixed - totalGap);
      var x = MARGIN.left;
      var boxTop = ctx.y - (hasLabels ? 11 : 0);
      cells.forEach(function (c) {
        var w = typeof c.w === "string" ? parseFloat(c.w) : (flexSum ? (c.w || 1) / flexSum * flexW : 0);
        if (c.label) ctx.page.drawText(c.label.toUpperCase(), { x: x, y: ctx.y - 8, size: 6.5, font: fonts.mono, color: hexColor("muted") });
        if (c.sub) {
          var subW = fonts.mono.widthOfTextAtSize(String(c.sub), 7);
          var subX = c.align === "center" ? x + (w - subW) / 2 : x;
          ctx.page.drawText(String(c.sub), { x: subX, y: boxTop - boxH - 8, size: 7, font: fonts.mono, color: hexColor("dim") });
        }
        if (c.type === "static") {
          ctx.page.drawText(sanitizeText(c.value == null ? "" : String(c.value)), { x: x + 1, y: boxTop - boxH + 5, size: c.size || 9.5, font: c.font || fonts.sans, color: c.color || hexColor("ink") });
        } else {
          ctx.page.drawRectangle({ x: x, y: boxTop - boxH, width: w, height: boxH, borderColor: hexColor("rule"), borderWidth: 0.75, color: WHITE });
          // addToPage first: it establishes the field's default appearance (font), which
          // setFontSize/enableMultiline/setAlignment all require to already exist.
          var tf = form.createTextField(ctx.field(c.name));
          tf.addToPage(ctx.page, { x: x + 2, y: boxTop - boxH + 2, width: Math.max(4, w - 4), height: boxH - 4, font: fonts.sans, textColor: hexColor("field") });
          if (c.multiline) tf.enableMultiline();
          if (c.maxLength) tf.setMaxLength(c.maxLength);
          if (c.align === "center" && PDFLib.TextAlignment) tf.setAlignment(PDFLib.TextAlignment.Center);
          if (c.align === "right" && PDFLib.TextAlignment) tf.setAlignment(PDFLib.TextAlignment.Right);
          tf.setFontSize(c.size || 9.5);
          safeSetText(tf, c.value);
        }
        x += w + gap;
      });
      ctx.y -= rowH + 6;
    };

    // total can legitimately be 0 (e.g. Resilience zeroed out by the Chrome Tax);
    // rather than a label with nothing after it, say so in the same muted caption.
    ctx.checkboxRow = function (label, name, total, checked, opts) {
      opts = opts || {};
      var box = opts.size || 9, gap = opts.gap || 3;
      ctx.ensure(box + 6);
      var lw = fonts.mono.widthOfTextAtSize(label.toUpperCase(), 7);
      ctx.page.drawText(label.toUpperCase(), { x: MARGIN.left, y: ctx.y - box + 1, size: 7, font: fonts.mono, color: hexColor("muted") });
      var x = MARGIN.left + lw + 10;
      if (total <= 0) {
        ctx.page.drawText("(none)", { x: x, y: ctx.y - box + 1, size: 7, font: fonts.mono, color: hexColor("dim") });
        ctx.y -= (box + 6);
        return;
      }
      for (var i = 0; i < total; i++) {
        var cb = form.createCheckBox(ctx.field(name + "." + i));
        if (i < (checked || 0)) cb.check();
        cb.addToPage(ctx.page, { x: x, y: ctx.y - box, width: box, height: box, borderColor: hexColor("rule"), borderWidth: 0.75 });
        x += box + gap;
      }
      ctx.y -= (box + 6);
    };

    ctx.multiline = function (label, name, opts) {
      opts = opts || {};
      var h = opts.height || 50;
      ctx.ensure(h + 14);
      if (label) ctx.page.drawText(label.toUpperCase(), { x: MARGIN.left, y: ctx.y - 7, size: 7, font: fonts.mono, color: hexColor("muted") });
      ctx.y -= 11;
      ctx.page.drawRectangle({ x: MARGIN.left, y: ctx.y - h, width: CONTENT_W, height: h, borderColor: hexColor("rule"), borderWidth: 0.75, color: WHITE });
      var tf = form.createTextField(ctx.field(name));
      tf.addToPage(ctx.page, { x: MARGIN.left + 4, y: ctx.y - h + 4, width: CONTENT_W - 8, height: h - 8, font: fonts.sans, textColor: hexColor("field") });
      tf.enableMultiline();
      tf.setFontSize(opts.size || 9);
      safeSetText(tf, opts.value);
      ctx.y -= (h + 6);
    };

    /* table(columns, name, rows): columns=[{header,key,w,align,size,type:'static'|undefined}]
       (w: flex weight or "60px"; a 'static' column prints plain text instead of a field, for
       structural labels like a skill's fixed attribute); rows=array of row-objects keyed by
       column.key, or null entries for blank write-in rows. */
    ctx.table = function (columns, name, rows) {
      var fixed = 0, flexSum = 0;
      columns.forEach(function (c) { if (typeof c.w === "string") fixed += parseFloat(c.w); else flexSum += (c.w || 1); });
      var gap = 4, totalGap = gap * (columns.length - 1);
      var flexW = Math.max(0, CONTENT_W - fixed - totalGap);
      var widths = columns.map(function (c) { return typeof c.w === "string" ? parseFloat(c.w) : (flexSum ? (c.w || 1) / flexSum * flexW : 0); });
      var boxH = 15;
      ctx.ensure(11 + boxH + 3);
      var x = MARGIN.left;
      columns.forEach(function (c, i) {
        ctx.page.drawText(c.header.toUpperCase(), { x: x, y: ctx.y - 8, size: 6.5, font: fonts.mono, color: hexColor("muted") });
        x += widths[i] + gap;
      });
      ctx.y -= 11;
      ctx.rule();
      rows.forEach(function (r, ri) {
        ctx.ensure(boxH + 3);
        var xx = MARGIN.left;
        columns.forEach(function (c, ci) {
          var val = r ? r[c.key] : null;
          if (c.type === "static") {
            ctx.page.drawText(sanitizeText(val == null ? "" : String(val)), { x: xx + 1, y: ctx.y - boxH + 4, size: c.size || 8.5, font: fonts.sans, color: hexColor("ink") });
          } else {
            ctx.page.drawRectangle({ x: xx, y: ctx.y - boxH, width: widths[ci], height: boxH, borderColor: hexColor("rule"), borderWidth: 0.6, color: WHITE });
            var tf = form.createTextField(ctx.field(name + "." + ri + "." + c.key));
            tf.addToPage(ctx.page, { x: xx + 2, y: ctx.y - boxH + 2, width: Math.max(4, widths[ci] - 4), height: boxH - 4, font: fonts.sans, textColor: hexColor("field") });
            if (c.align === "center" && PDFLib.TextAlignment) tf.setAlignment(PDFLib.TextAlignment.Center);
            tf.setFontSize(c.size || 8.5);
            safeSetText(tf, val);
          }
          xx += widths[ci] + gap;
        });
        ctx.y -= (boxH + 3);
      });
    };

    return ctx;
  }

  async function loadFonts(doc) {
    return {
      sans: await doc.embedFont(PDFLib.StandardFonts.Helvetica),
      bold: await doc.embedFont(PDFLib.StandardFonts.HelveticaBold),
      mono: await doc.embedFont(PDFLib.StandardFonts.Courier)
    };
  }

  /* =======================================================================
     Shared derivation helpers, ported from EN.printSheet's own private copies
     (this codebase's existing convention: each view module keeps its own small
     gear/feature lookups rather than sharing a gear-utils file, e.g. combat.js
     and printsheet.js each already carry their own weaponHit/findWeapon).
     ======================================================================= */
  var eng = EN.engine, store = EN.store;
  function sgn(n) { return eng.fmtMod(n); }
  function idSerial(ch) {
    return "ID." + ((ch.meta && ch.meta.id) ? ch.meta.id.replace(/[^a-z0-9]/gi, "").slice(-6).toUpperCase() : "000000");
  }
  // live current state (mirrors combatView's private state() helper) so the
  // fillable PDF prefills the same current Vitality/Wounds/Vigor the play
  // dashboard shows, rather than the static print sheet's always-blank boxes.
  function liveState(ch, d) {
    var woundsMax = d.woundsMax;
    var wounds = eng.clamp((ch.wounds && ch.wounds.current != null) ? ch.wounds.current : woundsMax, 0, woundsMax);
    var woundsLost = woundsMax - wounds;
    var vitMax = Math.max(0, (d.vitalityMax || 0) - woundsLost);
    var vit = eng.clamp((ch.vitality && ch.vitality.current != null) ? ch.vitality.current : vitMax, 0, vitMax);
    var vigor = (ch.vitality && ch.vitality.temp) || 0;
    var rdMax = d.resilienceMax, rdSpent = (ch.resilience && ch.resilience.spent) || 0;
    return { vit: vit, vitMax: vitMax, vigor: vigor, wounds: wounds, woundsMax: woundsMax, rd: Math.max(0, rdMax - rdSpent), rdMax: rdMax };
  }

  var GROUP_CAT = { Simple: "Simple Weapons", Martial: "Martial Weapons", Sidearm: "Sidearms", Longarm: "Longarms", Heavy: "Heavy Weapons", Launcher: "Explosive Launchers", Thrown: "Thrown Weapons", Bowfire: "Bowfire Weapons" };
  function findWeapon(name) {
    var g = EN.gearCatalog || {};
    return [].concat((g.melee && g.melee.items) || [], (g.ranged && g.ranged.items) || [], (g.signature && g.signature.items) || []).find(function (w) { return w.name === name; });
  }
  /* ONE ROW PER EQUIPPED PIECE. It used to dedupe to catalog names, because the Attacks
     list was "per weapon TYPE"; since 2026-08-12 mods, grip and magazine are per ENTRY, so
     two equipped Longswords can print two different attack profiles and the sheet is what
     the table is played from. `label` only numbers a name that actually repeats.
     equippedWeaponNames stays for the Equipped / Worn line, which genuinely wants names. */
  function equippedWeaponRows(ch) {
    var out = [];
    (ch.equippedWeapons || []).forEach(function (key) {
      var e = (ch.equipment || []).find(function (x) { return (x.id || x.name) === key; });
      if (!e || !(e.qty > 0)) return;
      var w = findWeapon(e.name);
      if (!w) return;
      out.push({ key: (e.id || e.name), name: e.name, w: w });
    });
    var total = {};
    out.forEach(function (r) { total[r.name] = (total[r.name] || 0) + 1; });
    var seen = {};
    out.forEach(function (r) {
      if (total[r.name] > 1) { seen[r.name] = (seen[r.name] || 0) + 1; r.label = r.name + " " + seen[r.name]; }
      else r.label = r.name;
    });
    return out;
  }
  function equippedWeaponNames(ch) {
    var out = [];
    (ch.equippedWeapons || []).forEach(function (key) {
      var e = (ch.equipment || []).find(function (x) { return (x.id || x.name) === key; });
      if (e && e.qty > 0 && out.indexOf(e.name) === -1) out.push(e.name);
    });
    return out;
  }
  function weaponHit(ch, d, w) {
    var melee = w._melee || w.group === "Simple" || w.group === "Martial";
    var thrown = (w.traits || []).some(function (t) { return /^Thrown/.test(t); });
    var finesse = (w.traits || []).some(function (t) { return /^Finesse/.test(t); });
    var bod = d.attributes.BOD.mod, agi = d.attributes.AGI.mod;
    var useAgi = melee ? (finesse && agi > bod) : (thrown ? agi >= bod : true);
    var mod = useAgi ? agi : bod;
    var cat = GROUP_CAT[w.group], tier = cat ? eng.effectiveGearTier(ch, "weapons", cat) : "untrained";
    var prof = ((EN.rules.profTiers || {})[tier] || {}).d20 || 0;
    var focusCal = cat && eng.weaponFocus && eng.weaponFocus(ch, cat, w.name) ? (d.caliber || 1) : 0;
    return mod + prof + focusCal;
  }

  /* The unarmed strike as an Attacks-table row, or nothing. Mirrors printsheet.js's
     copy of the same function and the on-screen row's own gate, so all three agree
     about when the strike is worth listing. */
  function unarmedAttackRow(ch, d) {
    var u = d.unarmed;
    if (!u) return [];
    var realWeapons = equippedWeaponNames(ch).filter(function (n) {
      var it = findWeapon(n);
      return !!it && !(eng.isUnarmedAugmentName && eng.isUnarmedAugmentName(it.name));
    });
    if (!(u.replacers.length || u.increases.count || u.riders.length || u.reach.spaces || !realWeapons.length)) return [];
    var fin = !!(u.traits && /Finesse/.test(u.traits));
    var attr = fin ? Math.max(d.attributes.BOD.mod, d.attributes.AGI.mod) : d.attributes.BOD.mod;
    var tier = eng.effectiveGearTier(ch, "weapons", "Simple Weapons");
    var prof = ((EN.rules.profTiers || {})[tier] || {}).d20 || 0;
    var name = u.replacer ? u.replacer.source : "Unarmed Strike";
    var dmg = (u.die || u.flat) + " " + u.type + " " + sgn(attr);
    (u.riders || []).forEach(function (r) { dmg += " + " + r.damage + (r.when ? " " + r.when : ""); });
    var notes = [];
    if (u.traits) notes.push(u.traits);
    if (u.reach.spaces) notes.push("+" + u.reach.spaces + " reach (" + u.reach.sources.join(", ") + ")");
    if (u.note) notes.push(u.note);
    if (tier === "untrained") notes.push("Untrained (Simple Weapons): Snag");
    return [{ name: name, atk: sgn(attr + prof), dmg: dmg, notes: notes.join(" · ") }];
  }

  /* ---- resource-spending abilities (Gambits/Maneuvers/etc), ported from printsheet.js ---- */
  function actionCost(text) {
    text = text || "";
    if (/Impulse Action/i.test(text)) return "Impulse";
    if (/Swift Action/i.test(text)) return "Swift";
    if (/Free Action/i.test(text)) return "Free";
    if (/Complex Action/i.test(text)) return "Action";
    if (/as an Action|use your Action|spend (?:an|your) Action|standard Action|as a single Action|take the Attack Action/i.test(text)) return "Action";
    return "Passive";
  }
  function costTag(text) {
    var m = (text || "").match(/(\d+)\s*(Bandwidth|Flow Points?|FP|Overdrive|Moxie|Leverage|Execution|Triage|Grit)\b/i);
    if (!m) return null;
    var r = m[2].toLowerCase();
    var abbr = r.indexOf("bandwidth") === 0 ? "BW" : (r.indexOf("flow") === 0 || r === "fp") ? "FP" : m[2].slice(0, 3).toUpperCase();
    return m[1] + " " + abbr;
  }
  function resAbbr(name) {
    var r = (name || "").toLowerCase();
    if (r.indexOf("bandwidth") === 0) return "BW";
    if (r.indexOf("flow") === 0 || r === "fp") return "FP";
    return (name || "RES").slice(0, 3).toUpperCase();
  }
  function actLabel(s) {
    if (/Impulse/i.test(s)) return "Impulse";
    if (/Swift/i.test(s)) return "Swift";
    if (/Free/i.test(s)) return "Free";
    if (/Action/i.test(s)) return "Action";
    return "";
  }
  function talentFeatures(ch) {
    var TAL = Array.isArray(EN.talents) ? EN.talents : [];
    return (ch.talents || []).map(function (tk) {
      var t = TAL.find(function (x) { return x.key === tk || x.name === tk; });
      return t ? { name: t.name, text: t.text || t.desc || "", source: "Talent", level: 0 } : null;
    }).filter(Boolean);
  }
  function gatherFeatures(ch, d) {
    var feats = (d.features || []).concat(talentFeatures(ch));
    if (ch.class === "codebreaker") {
      var EX = (EN.classes && EN.classes.codebreaker && EN.classes.codebreaker.extra && EN.classes.codebreaker.extra.gridExploits) || [];
      feats = feats.concat(EX.map(function (x) { return { name: x.name, text: (x.action ? x.action + ". " : "") + (x.text || ""), source: "Signature Exploit", level: 0 }; }));
    }
    feats = feats.filter(function (f) { return !/^(Universal Upgrade|Subclass Feature)$/.test(f.name) && !/Subclass( Capstone)?$/.test(f.name); });
    function base(n) { return n.replace(/\s*\([^)]*\)\s*$/, "").trim(); }
    var present = {}; feats.forEach(function (f) { present[f.name] = true; });
    var top = {};
    feats.forEach(function (f) {
      var b = base(f.name);
      if (b !== f.name && present[b]) { var c = top[b]; if (!c || (f.level || 0) >= (c.level || 0)) top[b] = { name: f.name, level: f.level || 0 }; }
    });
    return feats.filter(function (f) { var b = base(f.name); return !(b !== f.name && present[b]); })
      .map(function (f) { return top[f.name] ? { name: top[f.name].name, _base: f.name, text: f.text, source: f.source, level: f.level } : f; });
  }
  function resourceSpenders(ch, d, feats) {
    var res = d.resource || d.flow;
    if (!res || !res.name) return [];
    var rname = res.name, abbr = resAbbr(rname), seen = {}, rows = [];
    function add(name, cost, act) { var k = name.toLowerCase(); if (seen[k]) return; seen[k] = 1; rows.push({ name: name, cost: cost, act: act || "" }); }
    var resFeat = (d.features || []).find(function (f) { return f.name === rname; });
    var defCost = (((resFeat && resFeat.text) || res.fuels || "").match(/costs?\s+(\d+)\s/i) || [])[1] || "1";
    // one source of truth: the engine already handles the classes that know
    // every ability, which these local copies used to get wrong
    var gl = eng.chosenResourceAbilities ? eng.chosenResourceAbilities(ch)
           : (eng.gambitList ? eng.gambitList(ch) : []);
    if (gl.length) {
      var pick = gl;
      pick.forEach(function (g) { add(g.name, (g.cost || defCost) + " " + abbr, actLabel(g.action)); });
    }
    var spend = new RegExp("spend(?:s|ing)?\\s+\\d+\\s+" + rname, "i");
    (feats || []).forEach(function (f) {
      var t = f.text || "";
      if (f.name === rname || !spend.test(t)) return;
      var clause = t.split(/\.\s+/).find(function (s) { return spend.test(s); }) || t;
      var act = actionCost(clause);
      if (act === "Passive") return;
      add(f.name, costTag(t) || (defCost + " " + abbr), act);
    });
    return rows;
  }

  /* =======================================================================
     SECTION 01 - FRONT SHEET
     ======================================================================= */
  function buildFrontSheet(doc, form, fonts, ch, d) {
    var id = ch.identity || {};
    var ctx = makeCtx(doc, form, fonts, { title: "FREELANCER FIELD DOSSIER", tag: "01 · FRONT", serial: idSerial(ch), fieldPrefix: "front" });
    var classLine = [d.classInfo ? d.classInfo.name : "-", d.subclassInfo ? d.subclassInfo.name : null].filter(Boolean).join(" · ");
    var speciesLine = [d.speciesInfo ? d.speciesInfo.name : "-", d.lineageInfo ? d.lineageInfo.name : null].filter(Boolean).join(" · ");
    var progression = ch.useXp ? ("XP " + (d.xp || 0) + (d.xpForNext ? " / " + d.xpForNext : "")) : ("Milestones " + ((ch.milestones && ch.milestones.major) || 0) + " maj, " + ((ch.milestones && ch.milestones.minor) || 0) + " min");

    ctx.row([{ label: "Handle / alias", name: "handle", value: id.handle || ch.name, w: 1 }, { label: "Name on record", name: "name", value: ch.name, w: 1 }]);
    ctx.row([
      { label: "Class · level", name: "classLevel", value: classLine + " · L" + d.level, w: 3 },
      { label: "Lineage", name: "lineage", value: speciesLine, w: 2 },
      { label: "Cal", name: "cal", value: d.caliber, w: "40px", align: "center" },
      { label: "Size", name: "size", value: d.size || "-", w: "60px", align: "center" }
    ]);
    ctx.row([
      { label: "Background", name: "background", value: d.backgroundInfo ? d.backgroundInfo.name : "-", w: 1 },
      { label: "Progression", name: "progression", value: progression, w: 1 }
    ]);
    ctx.spacer(4);

    // top stat strip
    var dg = d.defenseGear || {};
    var st = liveState(ch, d);
    ctx.row([
      { label: "Def", name: "def", value: d.defense, w: 1, align: "center", size: 13, sub: (d.defenseAttr === "BOD" ? "Body" : "Agility") + (dg.shield ? " +shield" : "") },
      // d.armorDR is the worn suit's CURRENT DR; the sublabel names the damage
      { label: "DR", name: "dr", value: d.armorDR || 0, w: 1, align: "center", size: 13,
        sub: dg.armor ? (dg.armor.name + (dg.armorDRLost ? " (" + dg.armorDR + "/" + dg.armorBaseDR + ")" : "")) : "no armor" },
      { label: "SPD", name: "spd", value: d.speed, w: 1, align: "center", size: 13, sub: "spaces" },
      { label: "INIT", name: "init", value: sgn(Math.max(d.attributes.AGI.mod, d.attributes.WIT.mod)), w: 1, align: "center", size: 13, sub: d.attributes.WIT.mod > d.attributes.AGI.mod ? "Wits" : "Agility" }
    ], { height: 20 });

    // attribute matrix
    ctx.sectionTitle("Attribute Matrix");
    ctx.row((EN.rules.attributes || []).map(function (a) {
      var A = d.attributes[a.key];
      return { label: a.name, name: "attr." + a.key + ".score", value: A.score, w: 1, align: "center", size: 13, sub: sgn(A.mod) };
    }), { height: 18 });

    // skills
    ctx.sectionTitle("Skills", "d20 bonus  ·  Snag = untrained");
    ctx.table(
      [{ header: "Attr", key: "attr", w: "34px", type: "static" }, { header: "Skill", key: "name", w: 3, type: "static" }, { header: "Bonus", key: "bonus", w: "50px", align: "center" }],
      "skill",
      (d.skills || []).map(function (s) {
        return { attr: s.attr, name: s.name + (s.untrained ? "  (Snag)" : s.focus ? "  (Focus)" : ""), bonus: sgn(s.total) };
      })
    );

    // versatile skills
    ctx.sectionTitle("Versatile Skills");
    var V = ch.versatile || {};
    ctx.table(
      [{ header: "Skill", key: "name", w: 1, type: "static" }, { header: "Attribute", key: "attr", w: 1 }, { header: "Parent Skill", key: "parent", w: 1 }],
      "versatile",
      ["insight", "performance", "intimidation"].map(function (k) {
        var s = V[k] || {};
        return { name: k.charAt(0).toUpperCase() + k.slice(1), attr: s.attr || "", parent: s.skill || "" };
      })
    );

    // saves
    ctx.sectionTitle("Saves", "d20 + MOD + Caliber (Focus)");
    ctx.table(
      [{ header: "Save", key: "save", w: 1, type: "static" }, { header: "Focus", key: "focus", w: "60px", align: "center" }, { header: "Bonus", key: "bonus", w: "50px", align: "center" }],
      "save",
      (EN.rules.attributes || []).map(function (a) {
        var S = d.saves[a.key] || {};
        return { save: a.name, focus: S.focus ? "FOCUS" : "", bonus: sgn(S.bonus != null ? S.bonus : d.attributes[a.key].mod) };
      })
    );

    // conditions & fatigue
    ctx.sectionTitle("Conditions & Fatigue");
    ctx.multiline(null, "conditions", { value: (ch.conditions || []).join(", "), height: 24 });
    ctx.checkboxRow("Fatigue", "fatigue", 6, ch.fatigue || 0);

    // senses
    ctx.sectionTitle("Senses", "10 + MOD + PROF (+/- 5 Edge/Snag)");
    var passiveRows = [];
    ["perception", "investigation", "intuition", "systems"].forEach(function (k) {
      var s = (d.skills || []).find(function (x) { return x.key === k; });
      if (s) passiveRows.push({ name: "Passive " + s.name, val: s.passive });
    });
    ctx.table([{ header: "Sense", key: "name", w: 2, type: "static" }, { header: "Value", key: "val", w: "50px", align: "center" }], "passive", passiveRows);
    var SENSE_GRANTS = {
      "Lowlight Optics": { sense: "Darkvision", range: "12 sp." }, "Predator's Glare": { sense: "Darkvision", range: "6 sp." },
      "Fungal Network": { sense: "Tremor Sense", range: "6 sp." }, "Seismic Sense": { sense: "Tremor Sense", range: "8 sp." },
      "Warmblood Sense": { sense: "Heat Sense", range: "6 sp." }, "Blood-Scent Tracker": { sense: "Blood Scent", range: "6 sp." },
      "Disturbance Compass": { sense: "Flow Sense", range: "12 sp." }, "Scent Marker": { sense: "Scent Tracking", range: "1 mile" },
      "The Machine Medium": { sense: "Sprite Sight", range: "passive" }, "Echo Sighted": { sense: "Resonance Sense", range: "12 sp." }
    };
    var special = (d.features || []).map(function (f) { var g = SENSE_GRANTS[f.name]; return g ? { name: g.sense, val: g.range } : null; }).filter(Boolean);
    if (special.length) ctx.table([{ header: "Special Sense", key: "name", w: 2, type: "static" }, { header: "Range", key: "val", w: "60px", align: "center" }], "specialSense", special);

    // vitality & wounds
    ctx.sectionTitle("Vitality & Wounds", "Vigor to Vitality to Wounds");
    ctx.row([{ label: "Vigor", name: "vigor", value: st.vigor || "", w: 1 }], { height: 18 });
    // checked = spent (not available), so an untouched pool renders fully open
    // and a mid-session character still shows the dice it has actually burned
    ctx.checkboxRow("Resilience d" + (d.resilienceDie || "?"), "resilience", st.rdMax, st.rdMax - st.rd);
    ctx.row([
      { label: "Vitality", name: "vitality.current", value: st.vit, w: 1, align: "center" },
      { label: "Max", name: "vitality.max", value: st.vitMax, w: "50px", align: "center" }
    ]);
    ctx.row([
      { label: "Wounds", name: "wounds.current", value: st.wounds, w: 1, align: "center" },
      { label: "Max", name: "wounds.max", value: st.woundsMax, w: "50px", align: "center" }
    ]);
    ctx.checkboxRow("Death Saves - Success", "deathSaveS", 3, (ch.deathSaves && ch.deathSaves.s) || 0);
    ctx.checkboxRow("Death Saves - Fail", "deathSaveF", 3, (ch.deathSaves && ch.deathSaves.f) || 0);

    /* attacks. Same pair of corrections as the print sheet, and for the same reason:
       an unarmed AUGMENT is filtered out (Knuckles printed a 1d4 profile strictly
       worse than the punch it improves, which the app suppresses on screen), and the
       unarmed strike is printed in (neither export read `d.unarmed`, so a bare-handed
       Freelancer exported an empty table). Filtering without adding makes it worse.
       `equippedWeaponNames` stays unfiltered: the Equipped / Worn line is right that
       the Knuckles are on you. */
    /* Same reason as the print sheet: a Resistance changes every incoming damage number and
       nothing else on the page reveals it. One line, because the PDF is tight for space. */
    if ((d.resistances || []).length) {
      ctx.sectionTitle("Resistances");
      ctx.text(d.resistances.map(function (r) {
        return r.type + " " + r.level.toUpperCase() + " (" + r.sources.join(", ") + ")";
      }).join("  ·  "), { size: 8, h: 12 });
    }
    ctx.sectionTitle("Attacks");
    var atkRows = equippedWeaponRows(ch)
      .filter(function (r) { return !(eng.isUnarmedAugmentName && eng.isUnarmedAugmentName(r.w.name)); })
      .map(function (r) {
        var w = r.w, wKey = r.key;
        // same as the print sheet: the catalog traits, plus the reach the character
        // adds, so the exported row matches the one on the Freelancer tab
        var notes = (w.traits || []).slice();
        var wr = eng.weaponReach ? eng.weaponReach(ch, w, wKey) : null;
        if (wr && wr.melee && wr.note) notes.push(wr.note);
        // same as the print sheet: one damage rating, the one the grip selects
        var g = eng.weaponGrip ? eng.weaponGrip(ch, w, wKey) : null;
        var dmg = w.damage || "";
        if (g && g.versatile && g.forcedBy) {
          /* Forced into two hands, so the Versatile trait is gone, not merely unused:
             ONE die, and the trait chip goes with it. Same edit the weapon row makes. */
          dmg = dmg.replace(/^\s*\d+d\d+/, g.dice);
          notes = notes.filter(function (t) { return !/^Versatile\s*\(/i.test(String(t)); });
          notes.push("two-handed only (" + g.forcedBy + ")");
        } else if (g && g.versatile) {
          /* Both dice, in the book's own "1d8 (1d10)" order, because paper has no
             toggle: a player who switches grips mid-fight needs the other number
             printed in front of them. The stored grip still rides along as a note. */
          dmg = dmg.replace(/^\s*\d+d\d+/, g.baseDice + " (" + g.versatile + ")");
          notes.push(g.twoHanded ? "held two-handed (" + g.versatile + ")"
                                 : "held one-handed (" + g.baseDice + ")");
        }
        return { name: r.label, atk: sgn(weaponHit(ch, d, w)), dmg: dmg, notes: notes.join(", ") };
      });
    atkRows = atkRows.concat(unarmedAttackRow(ch, d));
    while (atkRows.length < 6) atkRows.push({ name: "", atk: "", dmg: "", notes: "" });
    ctx.table(
      [{ header: "Name", key: "name", w: 2 }, { header: "Atk Bonus / DC", key: "atk", w: 1, align: "center" }, { header: "Damage & Type", key: "dmg", w: 2 }, { header: "Notes", key: "notes", w: 2 }],
      "attack", atkRows
    );

    // abilities (resource spenders)
    var feats = gatherFeatures(ch, d);
    var spenders = resourceSpenders(ch, d, feats).slice(0, 10);
    var resLabel = d.resource ? (d.resource.name.toUpperCase() + "  MAX " + d.resource.max) : (d.flow ? "FLOW FP MAX " + d.flow.max : "");
    ctx.sectionTitle("Abilities", resLabel);
    var abilityRows = spenders.map(function (s) { return { name: s.name, cost: s.cost, act: s.act }; });
    while (abilityRows.length < 8) abilityRows.push({ name: "", cost: "", act: "" });
    ctx.table(
      [{ header: "Name", key: "name", w: 3 }, { header: "Cost", key: "cost", w: 1, align: "center" }, { header: "Action Type", key: "act", w: 1, align: "center" }],
      "ability", abilityRows
    );

    return ctx;
  }

  /* =======================================================================
     SECTION 02 - TALENTS & LINEAGE (abilities at a glance)
     ======================================================================= */
  function parseUses(text, d) {
    if (!text) return null;
    var t = text.replace(/\s+/g, " "), m;
    function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase(); }
    if ((m = t.match(/number of (?:times|uses)(?:[^.]{0,60}?)equal to your Caliber per (Long|Short) Rest/i))) return { max: d.caliber, recharge: cap(m[1]) + " Rest" };
    if (/number of (?:times|uses) per Encounter equal to your Caliber/i.test(t)) return { max: d.caliber, recharge: "Encounter" };
    if ((m = t.match(/\b(once|twice|(\d+) times) per (Long Rest|Short Rest|Encounter|scene)\b/i))) {
      var max = m[2] ? Number(m[2]) : (/twice/i.test(m[1]) ? 2 : 1);
      return { max: max, recharge: m[3] };
    }
    return null;
  }
  function autoBrief(text) {
    if (!text) return "";
    var t = text.replace(/\s+/g, " ").trim();
    var parts = t.split(/\.\s+/);
    var kw = /\b(gain|add|spend|roll|reroll|Edge|Snag|DC|damage|Resist|Immun|Advantage|reduce|deal|ignore|Speed|Defense|Vitality|Wound|Vigor|FP|Bandwidth|d4|d6|d8|d10|d12|d20|once per|\+\d)/i;
    var pick = parts.find(function (s) { return kw.test(s); }) || parts[0] || t;
    pick = pick.trim().replace(/[.]+$/, "");
    if (pick.length > 160) pick = pick.slice(0, 158).replace(/\s+\S*$/, "") + "...";
    return pick;
  }
  function briefFor(f) { var b = EN.briefs && EN.briefs[f._base || f.name]; return b || autoBrief(f.text); }

  function proficientCats(ch, bucket) {
    return ((EN.rules.gear || {})[bucket] || []).filter(function (cat) { return eng.effectiveGearTier(ch, bucket, cat) !== "untrained"; });
  }
  function proficiencyLines(ch) {
    var lines = [];
    [["Weapons", "weapons"], ["Armor", "armor"], ["Tools", "tools"], ["Vehicles", "vehicles"]].forEach(function (p) {
      var cats = proficientCats(ch, p[1]);
      if (cats.length) lines.push(p[0] + ": " + cats.join(", "));
    });
    function fsLabel(f) {
      var parent = f.parent || f.skill;
      var name = (f.type && f.type !== "skill") ? parent : ((EN.rules.skillByKey[parent] || {}).name || parent);
      return name + (f.aspect ? " (" + f.aspect + ")" : "") + (f.granted ? " [free]" : "");
    }
    var foci = (ch.skillFocuses || []).map(fsLabel);
    if (foci.length) lines.push("Focus: " + foci.join(", "));
    var specs = (ch.specializations || []).map(fsLabel);
    if (specs.length) lines.push("Spec: " + specs.join(", "));
    return lines;
  }

  function buildTalentsLineage(doc, form, fonts, ch, d) {
    var ctx = makeCtx(doc, form, fonts, { title: "TALENTS & LINEAGE", tag: "02 · PROGRESSION", serial: idSerial(ch), fieldPrefix: "talents" });
    ctx.sectionTitle("Abilities at a Glance", "track uses");
    var feats = gatherFeatures(ch, d);
    if (!feats.length) {
      ctx.text("No features yet.", { size: 9, color: hexColor("dim") });
    } else {
      var ACT_OVERRIDE = { Bandwidth: "Passive", Overdrive: "Passive", Leverage: "Passive", Moxie: "Passive", Execution: "Passive", Triage: "Passive", Reservoir: "Passive", "Core Channeling": "Passive", "Reality Fracture": "Swift" };
      var groups = { Passive: [], Action: [], Swift: [], Impulse: [], Free: [] };
      feats.forEach(function (f) { var act = ACT_OVERRIDE[f.name] || actionCost(f.text); (groups[act] || groups.Passive).push(Object.assign({}, f, { _act: act })); });
      var featIdx = 0;
      [["Passive", "PASSIVE"], ["Action", "ACTION"], ["Swift", "SWIFT ACTION"], ["Impulse", "IMPULSE · REACTION"], ["Free", "FREE ACTION"]].forEach(function (g) {
        var arr = groups[g[0]];
        if (!arr.length) return;
        ctx.text(g[1] + "  ·  " + arr.length, { size: 7.5, font: fonts.mono, color: hexColor("accent"), h: 12 });
        arr.forEach(function (f) {
          var cost = f._act !== "Passive" ? costTag(f.text) : null;
          var uses = parseUses(f.text, d);
          ctx.text(f.name + (cost ? "   [" + cost + "]" : ""), { size: 9, font: fonts.bold, h: 11 });
          ctx.text(briefFor(f), { size: 8, h: 10 });
          ctx.text((f.source || "") + (f.level ? " · L" + f.level : ""), { size: 6.5, color: hexColor("dim"), h: uses ? 8 : 11 });
          if (uses) ctx.checkboxRow("Uses (" + uses.recharge + ")", "ability." + (featIdx++) + ".uses", Math.min(uses.max, 8), 0, { size: 8 });
          else featIdx++;
        });
      });
    }

    var uu = ch.universalUpgrades || {};
    var uuKeys = Object.keys(uu);
    if (uuKeys.length) {
      ctx.sectionTitle("Universal Upgrades");
      uuKeys.sort(function (a, b) { return Number(a) - Number(b); }).forEach(function (lv) {
        var u = uu[lv] || {};
        var talName = function (k) { var t = (EN.talents || []).find(function (x) { return x.key === k || x.name === k; }); return t ? t.name : (k || ""); };
        var what = u.type === "attr" ? ("+1 " + (u.attr || "Attribute"))
          : u.type === "talent" ? ("Talent: " + talName(u.talent))
          : u.type === "talentUpgrade" ? ("Talent Upgrade: " + talName(u.talent))
          : u.type === "evolution" ? ("Lineage Evolution: " + (u.feature || u.name || ""))
          : (u.name || u.type || "choice");
        ctx.text("L" + lv + "   " + what, { size: 9, h: 13 });
      });
    }

    var profLines = proficiencyLines(ch);
    if (profLines.length) {
      ctx.sectionTitle("Proficiencies & Training");
      profLines.forEach(function (l) { ctx.text(l, { size: 9, h: 13 }); });
    }
    return ctx;
  }

  /* =======================================================================
     SECTION 03 - GEAR & HOLDINGS
     ======================================================================= */
  function allGear() {
    var g = EN.gearCatalog || {};
    return [].concat((g.melee && g.melee.items) || [], (g.ranged && g.ranged.items) || [], (g.signature && g.signature.items) || [],
      (g.signature && g.signature.munitions) || [], (g.ammo && g.ammo.items) || [], (g.armor && g.armor.items) || [], (g.tools && g.tools.items) || []);
  }
  function catItem(name) { return allGear().find(function (i) { return i.name === name; }); }
  // `drState` is the engine's armorState for THIS entry: armor DR is mutable and
  // per piece, so a damaged suit prints the DR it actually defends with. `shState`
  // is shieldState for the same entry, for the same reason: Durability is the same
  // mechanic and it used to leave the app on neither export.
  // `grip` is weaponGrip for this weapon, here for the same reason drState is:
  // which die a Versatile weapon deals is mutable and the catalog names two.
  function gearSummaryLine(it, drState, shState, grip) {
    var stat = [];
    if (it.damage && grip && grip.versatile && grip.forcedBy) {
      stat.push("Dmg " + (it.damage || "").replace(/^\s*\d+d\d+/, grip.dice)
        + " (two-handed only, " + grip.forcedBy + ")");
    } else if (it.damage && grip && grip.versatile) {
      stat.push("Dmg " + (it.damage || "").replace(/^\s*\d+d\d+/, grip.baseDice + " (" + grip.versatile + ")")
        + (grip.twoHanded ? ", held two-handed" : ", held one-handed"));
    } else if (it.damage) stat.push("Dmg " + it.damage);
    if (it.range) stat.push("Rng " + it.range);
    if (it.ammo != null) stat.push("Ammo " + it.ammo);
    if (it.dr != null) stat.push((drState && drState.base && drState.lost > 0)
      ? "DR " + drState.current + " of " + drState.base + " (" + drState.lost + " lost)"
      : "DR " + it.dr);
    // Same distinction the print sheet draws, and the same reason: an emitter at 0 boxes
    // goes dark and is repairable, a physical shield at 0 boxes is destroyed and is not.
    if (shState && shState.boxesMax) stat.push(shState.spent > 0
      ? "Durability " + shState.left + " of " + shState.boxesMax
        + (shState.destroyed ? (shState.emitter ? " (dark)" : " (destroyed)") : " (" + shState.spent + " marked)")
      : "Durability " + shState.boxesMax);
    // same as the print sheet: a forced grip has removed the Versatile trait
    var gTraits = (it.traits || []).filter(function (t) {
      return !(grip && grip.forcedBy && grip.versatile && /^Versatile\s*\(/i.test(String(t)));
    });
    if (gTraits.length) stat.push(gTraits.join(", "));
    if (it.skill) stat.push("Skill: " + it.skill);
    return stat.join("  ·  ");
  }

  function buildGearHoldings(doc, form, fonts, ch, d) {
    var ctx = makeCtx(doc, form, fonts, { title: "GEAR & HOLDINGS", tag: "03 · GEAR", serial: idSerial(ch), fieldPrefix: "gear" });

    /* Both wallets print as CODE then figure, the notation the book gives them.
       Glimmer carried a bare number before, so a filled-in PDF said 12,345 without saying
       of WHAT, next to a Nexus box in a different currency entirely.

       AND THE NEXUS BOX WAS ALWAYS EMPTY. ch.nexus is a real stored balance, seeded and
       type-guarded in store.js beside ch.glimmer and spent by the same benches, but this
       row hardcoded "" and never read it, so the one currency the book calls watched money
       printed blank on every sheet ever exported. It is read now. */
    ctx.row([
      { label: "Glimmer",      name: "glimmer", value: "GLM " + money(ch.glimmer), w: 1 },
      { label: "Nexus Tokens", name: "nexus",   value: "NXT " + money(ch.nexus),   w: 1 }
    ]);

    var dg = d.defenseGear || {};
    var loadout = equippedWeaponNames(ch).slice();
    if (dg.armor) loadout.push("Armor: " + dg.armor.name);
    if (dg.shield) loadout.push("Shield: " + dg.shield.name
      + (dg.shieldSpent > 0 ? " (" + dg.shieldBoxesLeft + " of " + dg.shieldBoxesMax + " boxes)" : ""));
    if (dg.focus) loadout.push("Focus: " + dg.focus.name);
    ctx.sectionTitle("Equipped / Worn");
    ctx.text(loadout.length ? loadout.join("  ·  ") : "Nothing equipped.", { size: 9, h: 14 });

    ctx.sectionTitle("Inventory", "item detail");
    var entries = (ch.equipment || []).filter(function (e) { return e.qty > 0; });
    var invRows = entries.map(function (e) {
      var it = catItem(e.name);
      var key = e.id || e.name;
      var worn = (ch.equippedWeapons || []).indexOf(key) !== -1 || ch.equippedArmor === key || ch.equippedShield === key || ch.equippedFocus === key;
      return { name: e.name, qty: e.qty, status: worn ? "Equipped" : "Stash",
               notes: it ? gearSummaryLine(it, eng.armorState ? eng.armorState(ch, key) : null,
                                           eng.shieldState ? eng.shieldState(ch, key) : null,
                                           eng.weaponGrip ? eng.weaponGrip(ch, it, key) : null) : "" };
    });
    if (!invRows.length) invRows.push({ name: "", qty: "", status: "", notes: "" });
    ctx.table(
      [{ header: "Item", key: "name", w: 2 }, { header: "Qty", key: "qty", w: "40px", align: "center" }, { header: "Status", key: "status", w: "70px", type: "static" }, { header: "Notes", key: "notes", w: 3 }],
      "inv", invRows
    );

    var stash = (ch.cyberStash || []);
    if (stash.length) {
      ctx.sectionTitle("Chrome Stash", "uninstalled");
      ctx.table(
        [{ header: "Name", key: "name", w: 2, type: "static" }, { header: "Zone", key: "zone", w: 1, type: "static" }, { header: "SP", key: "sp", w: "40px", align: "center", type: "static" }],
        "chromeStash",
        stash.map(function (cw) { return { name: cw.name || cw.base, zone: cw.zone || "", sp: (cw.sp || 0) }; })
      );
    }

    ctx.sectionTitle("Load / Carry");
    var enc = d.encumbrance || {};
    ctx.row([
      { label: "Current Load", name: "loadCurrent", value: enc.current != null ? enc.current : "", w: 1, align: "center" },
      { label: "Threshold", name: "loadThreshold", value: enc.threshold != null ? enc.threshold : "", w: 1, align: "center" }
    ]);
    ctx.multiline(null, "carryNotes", { height: 40 });

    return ctx;
  }

  /* =======================================================================
     SECTION 04 - PROFILE
     ======================================================================= */
  function buildProfile(doc, form, fonts, ch, d) {
    var id = ch.identity || {};
    var ctx = makeCtx(doc, form, fonts, { title: "PROFILE", tag: "04 · PROFILE", serial: idSerial(ch), fieldPrefix: "profile" });

    ctx.multiline("Concept", "concept", { value: id.concept, height: 34 });
    ctx.multiline("Where you came from", "whereFrom", { value: id.whereFrom, height: 34 });
    ctx.sectionTitle("Appearance");
    ctx.multiline(null, "appearance", { value: id.appearance, height: 50 });
    ctx.sectionTitle("Inner Profile", "pure story");
    ctx.multiline("Facets", "facets", { value: id.facets, height: 40 });
    ctx.multiline("Core Sparks", "coreSparks", { value: id.coreSparks, height: 40 });
    ctx.multiline("Tethers", "tethers", { value: id.tethers, height: 40 });
    ctx.multiline("Fault Lines", "faultLines", { value: id.faultLines, height: 40 });
    ctx.sectionTitle("Contacts & Crews");
    ctx.multiline(null, "contacts", { height: 40 });
    ctx.sectionTitle("Backstory & Notes");
    ctx.multiline(null, "backstory", { value: id.notes, height: 80 });

    ctx.sectionTitle("Standing", "Cred · Heat");
    ctx.checkboxRow("Cred", "cred", 10, 0);
    ctx.checkboxRow("Heat", "heat", 10, 0);

    return ctx;
  }

  /* =======================================================================
     SECTION 05 - SYSTEMS (Flow / Cyberware / #GRID; only what the build uses)
     ======================================================================= */
  function buildSystems(doc, form, fonts, ch, d) {
    var installed = (eng.installedCyberware ? eng.installedCyberware(ch) : (ch.cyberware || []));
    var hasFlow = !!d.flow;
    var hasChrome = installed.length > 0;
    var hasGrid = d.grid && (d.grid.userType === "Power User" || (ch.grid && ch.grid.deckType));
    if (!hasFlow && !hasChrome && !hasGrid) return null;

    var ctx = makeCtx(doc, form, fonts, { title: "SYSTEMS", tag: "05 · SYSTEMS", serial: idSerial(ch), fieldPrefix: "sys" });
    var any = false;

    if (hasFlow) {
      any = true;
      var f = d.flow;
      ctx.sectionTitle("Flow Reservoir", f.attributeName + " · Overdraw at 0 FP");
      ctx.row([
        { label: "FP Max", name: "flow.fpMax", value: f.max, w: 1, align: "center" },
        { label: "Flow DC", name: "flow.dc", value: f.dc, w: 1, align: "center" },
        { label: "Flow Atk", name: "flow.atk", value: sgn(f.attackBonus), w: 1, align: "center" },
        { label: "FP Now", name: "flow.fpNow", value: "", w: 1, align: "center" }
      ]);
      ctx.checkboxRow("Strain", "flow.strain", 6, 0);
      ctx.sectionTitle("Known Resonances", "Kinetic · Thermal · EM · Visceral · Spatial · Cognitive · Temporal");
      ctx.table([{ header: "Resonance / Invocation", key: "name", w: 1 }], "flow.resonance", [null, null, null, null, null]);
      ctx.multiline("Counter Flow", "counterFlow", { height: 30 });
      ctx.multiline("Static Zones", "staticZones", { height: 30 });
    }

    if (hasChrome) {
      if (any) ctx.rule();
      any = true;
      var tax = d.chromeTax || { total: 0, index: 0, resDiePenalty: 0 };
      ctx.sectionTitle("Cybernetic Frame", "Static " + tax.total + " SP");
      ctx.row([
        { label: "Static", name: "chrome.static", value: tax.total, w: 1, align: "center" },
        { label: "Chrome Tax", name: "chrome.tax", value: "T" + (tax.index || 0), w: 1, align: "center" },
        { label: "Installed", name: "chrome.installed", value: installed.length, w: 1, align: "center" }
      ]);
      ctx.table(
        [{ header: "Name", key: "name", w: 2, type: "static" }, { header: "Zone", key: "zone", w: 1, type: "static" }, { header: "SP", key: "sp", w: "36px", align: "center", type: "static" }, { header: "Notes", key: "notes", w: 2 }],
        "chrome",
        installed.map(function (cw) { return { name: cw.name || cw.base || "Chrome", zone: cw.zone || "", sp: cw.sp || 0, notes: "" }; })
      );
    }

    if (hasGrid) {
      if (any) ctx.rule();
      var g = d.grid, deck = g.deck;
      ctx.sectionTitle("#GRID Rig", g.userType);
      ctx.row([
        { label: "Cipher Atk", name: "grid.cipherAtk", value: sgn(g.effectiveAttack), w: 1, align: "center" },
        { label: "Save DC", name: "grid.saveDc", value: g.effectiveSaveDC, w: 1, align: "center" },
        { label: "Links", name: "grid.links", value: g.unlimitedLinks ? "no cap" : g.maxLinks, w: 1, align: "center" },
        { label: "Stability", name: "grid.stability", value: "DC " + g.stabilityDcBase, w: 1, align: "center" }
      ]);
      ctx.row([
        { label: "Smartdeck / Buddy", name: "grid.deck", value: deck ? deck.tier + (deck.type === "buddy" ? " Buddy" : " Deck") : "-", w: 2 },
        { label: "Device", name: "grid.device", value: deck ? sgn(deck.deviceBonus) : "-", w: "54px", align: "center" },
        { label: "Integrity", name: "grid.deckIntegrity", value: deck ? deck.maxIntegrity : "-", w: "54px", align: "center" },
        { label: "Bandwidth", name: "grid.bandwidth", value: g.bandwidthMax != null ? g.bandwidthMax : "-", w: "60px", align: "center" }
      ]);
      ctx.sectionTitle("Repertoire", "cipher · CX · cost");
      ctx.table(
        [{ header: "Cipher", key: "name", w: 2 }, { header: "CX", key: "cx", w: "50px", align: "center" }, { header: "Cost", key: "cost", w: "50px", align: "center" }],
        "grid.rep",
        [null, null, null, null, null, null, null, null]
      );
    }

    return ctx;
  }

  /* ---- proof-of-concept stub (task #62): one page, one field ------------- */
  async function buildProof() {
    var doc = await PDFLib.PDFDocument.create();
    var page = doc.addPage([612, 792]);
    var font = await doc.embedFont(PDFLib.StandardFonts.Helvetica);
    page.drawText("Elysium Nights - pdf-lib pipeline proof", { x: 50, y: 740, size: 14, font: font });
    var form = doc.getForm();
    var field = form.createTextField("proof.handle");
    field.setText("Daggerheart");
    field.addToPage(page, { x: 50, y: 700, width: 200, height: 20, font: font });
    return doc.save();
  }

  /* ---- toolkit smoke test (task #63): exercises every primitive once ------ */
  async function buildToolkitSmokeTest() {
    var doc = await PDFLib.PDFDocument.create();
    var form = doc.getForm();
    var fonts = await loadFonts(doc);
    var ctx = makeCtx(doc, form, fonts, { title: "TOOLKIT SMOKE TEST", tag: "T · TEST", serial: "ID.SMOKE01", fieldPrefix: "smoke" });
    ctx.sectionTitle("Row primitive", "flex + fixed widths");
    ctx.row([{ label: "Handle", name: "handle", value: "Daggerheart", w: 2 }, { label: "Cal", name: "cal", value: "5", w: "40px", align: "center" }]);
    ctx.sectionTitle("Checkbox row");
    ctx.checkboxRow("Fatigue", "fatigue", 6, 2);
    ctx.sectionTitle("Multiline");
    ctx.multiline("Notes", "notes", { value: "line one\nline two", height: 40 });
    ctx.sectionTitle("Table");
    ctx.table(
      [{ header: "Name", key: "name", w: 2 }, { header: "Bonus", key: "bonus", w: "60px", align: "center" }],
      "atk",
      [{ name: "Dagger", bonus: "+14" }, null]
    );
    // force a page break to prove continuation headers/footers work
    ctx.ensure(900);
    ctx.sectionTitle("After a forced page break");
    ctx.row([{ label: "Still works", name: "after_break", value: "yes", w: 1 }]);
    return doc.save();
  }

  /* ---- the real dossier: all five sections, mirroring EN.printSheet's pages ---- */
  async function build(ch) {
    var d = eng.derive(ch);
    var doc = await PDFLib.PDFDocument.create();
    var form = doc.getForm();
    var fonts = await loadFonts(doc);
    buildFrontSheet(doc, form, fonts, ch, d);
    buildTalentsLineage(doc, form, fonts, ch, d);
    buildGearHoldings(doc, form, fonts, ch, d);
    buildProfile(doc, form, fonts, ch, d);
    buildSystems(doc, form, fonts, ch, d);   // omits itself (no pages) if the build uses no systems
    return doc.save();
  }

  async function download(ch) {
    if (!ch) { toast("No #PRINT on file."); return; }
    try {
      var bytes = await build(ch);
      var blob = new Blob([bytes], { type: "application/pdf" });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = (ch.name || "freelancer").replace(/[^\w]+/g, "_") + "_fillable.pdf";
      a.click();
      toast("Fillable PDF generated.");
    } catch (e) {
      toast("Fillable PDF failed to generate.");
    }
  }

  return { buildProof: buildProof, buildToolkitSmokeTest: buildToolkitSmokeTest, build: build, download: download };
})();
