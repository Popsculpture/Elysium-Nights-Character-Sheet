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

    ctx.text = function (str, opts) {
      opts = opts || {};
      var size = opts.size || 9, font = opts.font || fonts.sans, h = opts.h || (size + 4);
      ctx.ensure(h);
      ctx.page.drawText(str, { x: MARGIN.left + (opts.x || 0), y: ctx.y - size, size: size, font: font, color: opts.color || hexColor("ink") });
      ctx.y -= h;
    };

    /* row(cells): cells=[{label,name,value,w,type:'static'|undefined,size,align,font,color}]
       w is a flex weight (number, default 1) OR a fixed width string like "60px". */
    ctx.row = function (cells, opts) {
      opts = opts || {};
      var boxH = opts.height || 16;
      var hasLabels = cells.some(function (c) { return c.label; });
      var rowH = (hasLabels ? 11 : 0) + boxH;
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
        if (c.type === "static") {
          ctx.page.drawText(c.value == null ? "" : String(c.value), { x: x + 1, y: boxTop - boxH + 5, size: c.size || 9.5, font: c.font || fonts.sans, color: c.color || hexColor("ink") });
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
          if (c.value != null && c.value !== "") tf.setText(String(c.value));
        }
        x += w + gap;
      });
      ctx.y -= rowH + 6;
    };

    ctx.checkboxRow = function (label, name, total, checked, opts) {
      opts = opts || {};
      var box = opts.size || 9, gap = opts.gap || 3;
      ctx.ensure(box + 6);
      var lw = fonts.mono.widthOfTextAtSize(label.toUpperCase(), 7);
      ctx.page.drawText(label.toUpperCase(), { x: MARGIN.left, y: ctx.y - box + 1, size: 7, font: fonts.mono, color: hexColor("muted") });
      var x = MARGIN.left + lw + 10;
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
      if (opts.value) tf.setText(String(opts.value));
      ctx.y -= (h + 6);
    };

    /* table(columns, name, rows): columns=[{header,key,w,align,size}] (w: flex weight or "60px");
       rows=array of row-objects keyed by column.key, or null entries for blank write-in rows. */
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
          ctx.page.drawRectangle({ x: xx, y: ctx.y - boxH, width: widths[ci], height: boxH, borderColor: hexColor("rule"), borderWidth: 0.6, color: WHITE });
          var tf = form.createTextField(ctx.field(name + "." + ri + "." + c.key));
          tf.addToPage(ctx.page, { x: xx + 2, y: ctx.y - boxH + 2, width: Math.max(4, widths[ci] - 4), height: boxH - 4, font: fonts.sans, textColor: hexColor("field") });
          if (c.align === "center" && PDFLib.TextAlignment) tf.setAlignment(PDFLib.TextAlignment.Center);
          tf.setFontSize(c.size || 8.5);
          if (val != null && val !== "") tf.setText(String(val));
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
      mono: await doc.embedFont(PDFLib.StandardFonts.Courier),
      monoBold: await doc.embedFont(PDFLib.StandardFonts.CourierBold)
    };
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

  async function download(ch) {
    if (!ch) { toast("No #PRINT on file."); return; }
    try {
      var bytes = await buildProof();   // TODO: swap for the real multi-page build()
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

  return { buildProof: buildProof, buildToolkitSmokeTest: buildToolkitSmokeTest, download: download };
})();
