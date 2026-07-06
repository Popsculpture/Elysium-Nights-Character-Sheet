/* ===========================================================================
   ELYSIUM NIGHTS - Fillable PDF export ("Freelancer Field Dossier", editable)
   Builds a real AcroForm PDF via the vendored pdf-lib, pre-filled from
   EN.engine.derive(ch) but editable in any PDF reader. Mirrors the pages of
   EN.printSheet, laid out fresh in PDF coordinates rather than copying the
   on-screen CSS.
   =========================================================================== */
window.EN = window.EN || {};

EN.pdfExport = (function () {
  var toast = EN.ui.toast;

  /* ---- proof-of-concept stub (task #62): one page, one field ------------- */
  async function buildProof() {
    var PDFLib = window.PDFLib;
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

  return { buildProof: buildProof, download: download };
})();
