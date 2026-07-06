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
            ctx.page.drawText(val == null ? "" : String(val), { x: xx + 1, y: ctx.y - boxH + 4, size: c.size || 8.5, font: fonts.sans, color: hexColor("ink") });
          } else {
            ctx.page.drawRectangle({ x: xx, y: ctx.y - boxH, width: widths[ci], height: boxH, borderColor: hexColor("rule"), borderWidth: 0.6, color: WHITE });
            var tf = form.createTextField(ctx.field(name + "." + ri + "." + c.key));
            tf.addToPage(ctx.page, { x: xx + 2, y: ctx.y - boxH + 2, width: Math.max(4, widths[ci] - 4), height: boxH - 4, font: fonts.sans, textColor: hexColor("field") });
            if (c.align === "center" && PDFLib.TextAlignment) tf.setAlignment(PDFLib.TextAlignment.Center);
            tf.setFontSize(c.size || 8.5);
            if (val != null && val !== "") tf.setText(String(val));
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
      mono: await doc.embedFont(PDFLib.StandardFonts.Courier),
      monoBold: await doc.embedFont(PDFLib.StandardFonts.CourierBold)
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
    var gl = eng.gambitList ? eng.gambitList(ch) : [];
    if (gl.length) {
      var pick = (ch.gambits && ch.gambits.length) ? gl.filter(function (g) { return ch.gambits.indexOf(g.name) !== -1; }) : gl;
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
      { label: "DR", name: "dr", value: d.armorDR || 0, w: 1, align: "center", size: 13, sub: dg.armor ? dg.armor.name : "no armor" },
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
    ctx.checkboxRow("Resilience d" + (d.resilienceDie || "?"), "resilience", st.rdMax, st.rd);
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

    // attacks
    ctx.sectionTitle("Attacks");
    var atkRows = equippedWeaponNames(ch).map(findWeapon).filter(Boolean).map(function (w) {
      return { name: w.name, atk: sgn(weaponHit(ch, d, w)), dmg: w.damage || "", notes: (w.traits || []).join(", ") };
    });
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

  /* ---- the real dossier: front sheet only for now; pages 2-5 land next ---- */
  async function build(ch) {
    var d = eng.derive(ch);
    var doc = await PDFLib.PDFDocument.create();
    var form = doc.getForm();
    var fonts = await loadFonts(doc);
    buildFrontSheet(doc, form, fonts, ch, d);
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
