/* ===========================================================================
   ELYSIUM NIGHTS · GM Job Board (Admin tab)
   STUB. The module phase replaces this whole file. It exists so the tab and
   its script tag are wired before the module lands: render() draws the
   heading and a holding box.

   The finished module rolls a job off the book's five tables and the Twelve
   Postings (book data in EN.gmBook.jobs) and keeps the job log.
   =========================================================================== */
window.EN = window.EN || {};

EN.gmJobs = (function () {
  var el = EN.ui.el;

  // each view carries its own heading, per the house convention (see gm.js)
  function heading(title, sub) {
    return el("div.row.between.wrap", { style: { marginBottom: "14px" } }, [
      el("h1", { style: { fontSize: "22px", letterSpacing: ".06em" },
        html: title + ' <span class="dim3" style="font-size:13px">' + sub + "</span>" })
    ]);
  }

  function render(mount) {
    EN.ui.clear(mount);
    mount.appendChild(el("div", null, [
      heading("Job Board", "// roll a job"),
      el("div.muted-box", { style: { padding: "26px" },
        text: "The Job Board module is being built. The roll tables, the postings and the job log land here." })
    ]));
  }

  return { render: render };
})();
