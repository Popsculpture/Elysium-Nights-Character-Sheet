/* ===========================================================================
   ELYSIUM NIGHTS · GM Encounters (Admin tab)
   STUB. The module phase replaces this whole file. It exists so the tab, the
   script tag and the Table hook are wired before the module lands: render()
   draws the heading and a holding box, and tableExtra() draws nothing.

   The finished module budgets and builds a fight (book data in
   EN.gmBook.encounters, math in EN.gmEngine) and hangs the Security Response
   clock and the XP award under the Table's initiative order.
   =========================================================================== */
window.EN = window.EN || {};

EN.gmEncounters = (function () {
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
      heading("Encounters", "// budget and build a fight"),
      el("div.muted-box", { style: { padding: "26px" },
        text: "The Encounters module is being built. The budget, the lines and the run-on-the-Table button land here." })
    ]));
  }

  // ctx is {encounter, crew}; returns a DOM node or null. The stub has nothing to show.
  function tableExtra(ctx) { return null; }

  return { render: render, tableExtra: tableExtra };
})();

// looked up through the namespace on every call, so a later EN.gmEncounters.tableExtra is the one drawn
if (EN.gmView && EN.gmView.registerTableExtra) {
  EN.gmView.registerTableExtra("encounters", function (ctx) { return EN.gmEncounters.tableExtra(ctx); });
}
