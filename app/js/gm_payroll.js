/* ===========================================================================
   ELYSIUM NIGHTS · GM Payroll (Admin tab)
   STUB. The module phase replaces this whole file. It exists so the tab and
   its script tag are wired before the module lands: render() draws the
   heading and a holding box.

   The finished module quotes contract pay, bounties and salvage (book data in
   EN.gmBook.payroll) and splits a payout through EN.engine.splitPayout, the
   same splitter the player's SPLIT panel uses.
   =========================================================================== */
window.EN = window.EN || {};

EN.gmPayroll = (function () {
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
      heading("Payroll", "// paying the crew"),
      el("div.muted-box", { style: { padding: "26px" },
        text: "The Payroll module is being built. The pay grid, bounties, salvage and the payday land here." })
    ]));
  }

  return { render: render };
})();
