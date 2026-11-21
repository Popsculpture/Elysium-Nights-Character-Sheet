/* ===========================================================================
   ELYSIUM NIGHTS · GM Sysop (Admin tab)
   The Admin desktop's control tab (the Admin reorganization, 14 Nov 2026). It holds everything the GM keeps
   about the table itself, as four sub-tabs drawn under one heading (EN.gmView.renderGroup, js/app.js):
     CREW        the invite link, the roster, the sends, who is blocked   (js/gm_campaign.js)
     HOUSE RULES Advancement Type, and the table's rules                  (js/gm_campaign.js)
     DATA        SYNC, and backing up and restoring the desktop           (this file)
     CAMPAIGN    rename, hand on, delete                                  (js/gm_campaign.js)
   This file is DATA: what used to live in the settings tray under GM DATA, with the SYNC button that sat
   above the Table. They moved here so a player who opens Settings on their own device never sees them.

   Everything the GM side keeps lives in one document on this device (EN.gmStore, en_gm_v1). Export downloads
   it the way #PRINT downloads a Freelancer; import replaces it whole. Import is two steps on purpose: picking
   a file only READS it and checks it (EN.gmStore.inspectDoc), then the page names the file and what it holds
   next to an armed REPLACE button. Nothing is replaced until that second click, so a wrong file costs a
   cancel, not a campaign.
   =========================================================================== */
window.EN = window.EN || {};

EN.gmSysop = (function () {
  var el = EN.ui.el, toast = EN.ui.toast;
  var _import = null;   // { name, text, counts }: a picked file, read and checked but not yet applied

  function plural(n, one, many) { return n + " " + (n === 1 ? one : many); }
  function stamp() {
    var d = new Date();
    function p(n) { return (n < 10 ? "0" : "") + n; }
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
  }
  // a campaign's name as part of a file name: letters and digits, the rest as single dashes
  function slug(name) { return String(name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40); }
  function download(text, stem) {
    var blob = new Blob([text], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "elysium-gm-" + (stem ? stem + "-" : "") + stamp() + ".json";
    a.click();
    if (EN.w98 && EN.w98.moment) EN.w98.moment("file", { dir: "out" });
  }
  function lbl(t, top) { return el("label.fl", { style: top ? { marginTop: "12px" } : null, text: t }); }
  function help(t, extra) { return el("p.help", { style: Object.assign({ margin: "0 0 8px" }, extra || {}), text: t }); }
  function repaint() { EN.app.render(); }

  function exportData() {
    var G = EN.gmStore, text, here = G.desk ? G.desk() : null;
    try { text = G.exportDoc(); } catch (e) { toast("GM data could not be exported."); return; }
    download(text, here ? slug(here.name) : "");
    toast("GM data exported.");
  }
  function importData() {
    var pending = _import, G = EN.gmStore;
    if (!pending) return;
    _import = null;
    var c;
    try { c = G.importDoc(pending.text); }
    catch (err) { toast((err && err.message) || "That file could not be imported."); repaint(); return; }
    repaint();
    var msg = "GM data imported: " + G.countText(c) + ".";
    if (c.droppedCrew) msg += " " + plural(c.droppedCrew, "crew row was", "crew rows were") + " dropped, for Freelancers not on this device.";
    // imported writes are history only: they were made to records on the device that exported them
    if (c.importedWrites) msg += " " + plural(c.importedWrites, "write to a Freelancer record is", "writes to Freelancer records are") + " kept as history and cannot be undone here.";
    if (!c.saved) msg += " NOT SAVED: this device refused the write, so it lasts until reload.";
    toast(msg);
  }

  /* ---- SYNC: this campaign's desktop, saved to the account, plus what the others who run it saved ---- */
  function syncPanel() {
    var C = EN.campaigns, mine = C && C.running ? C.running() : [];
    var kids = [];
    if (!mine.length) kids.push(help("SYNC is for a campaign's desktop. You run no campaign yet, so this device's own desktop is all there is."));
    else if (!C.desktop()) kids.push(help("This tab is on this device's own desktop, which has no campaign to sync. Pick a campaign in the top bar."));
    else {
      kids.push(help("A desktop lives in one browser. One press saves this campaign's desktop to your account and adds what the others who run the campaign saved. It only ever adds."));
      var block = EN.gmView && EN.gmView.syncBlock ? EN.gmView.syncBlock() : null;
      if (block) kids.push(block);
    }
    return EN.ui.panel("Sync", null, kids);
  }

  /* ---- back up and restore ---- */
  function backupPanel() {
    var G = EN.gmStore, here = G.desk ? G.desk() : null;
    var running = EN.campaigns && EN.campaigns.running ? EN.campaigns.running() : [];
    // a file picked on another desktop is not offered over this one
    if (_import && _import.desk !== (here ? here.id : "")) _import = null;
    var picker = el("input", { type: "file", accept: ".json,application/json", style: { display: "none" },
      onchange: function (e) {
        var f = e.target.files && e.target.files[0];
        e.target.value = "";   // the same file can be picked again after a cancel
        if (!f) return;
        var r = new FileReader();
        r.onerror = function () { toast("Could not read that file."); };
        r.onload = function () {
          var text = String(r.result || "");
          try { _import = { name: f.name, text: text, counts: G.inspectDoc(text), desk: here ? here.id : "" }; if (EN.w98 && EN.w98.moment) EN.w98.moment("file", { dir: "in" }); }
          catch (err) { _import = null; toast((err && err.message) || "That file is not GM data."); }
          if (EN.ui.disarm) EN.ui.disarm();
          repaint();
        };
        r.readAsText(f);
      } });
    // an Admin with no campaign reads exactly what they always have
    var hint = here
      ? "This is " + here.name + "'s desktop: its Table, encounters, job log, ledger, Heat log, contact cards and saved scenes, with the saved threats and custom hazards every desktop shares. It is stored on this device only. Export it to keep a copy or to move it to another device. Importing replaces this desktop and adds the file's threats and hazards to the shared ones."
      : running.length
        ? "This is this device's own desktop, for play with no campaign. It also holds the saved threats and custom hazards every desktop shares. It is stored on this device only. Export it to keep a copy or to move it to another device. Importing replaces all of it, shared threats and hazards too."
        : "Everything the Admin desktop keeps: saved threats and encounters, custom hazards, the job log, the ledger, the Heat log, contact cards, saved scenes, and the live encounter. It is stored on this device only. Export it to keep a copy or to move it to another device. Importing replaces all of it.";
    var kids = [
      help(hint),
      el("div.row.wrap", { style: { gap: "8px" } }, [
        el("button.btn.sm", { dataset: { gm: "export" }, title: "Download this desktop's GM data as a .json file", onclick: exportData }, "⤓ EXPORT GM DATA"),
        el("button.btn.sm", { dataset: { gm: "import" }, title: "Pick a GM data file to import; nothing is replaced until you confirm",
          onclick: function () { picker.click(); } }, "⤒ IMPORT GM DATA")
      ]),
      picker
    ];
    if (_import) {
      var from = _import.counts.campaign ? " It was exported from " + _import.counts.campaign + "." : "";
      kids.push(help("Ready to import " + _import.name + ": " + G.countText(_import.counts) + "." + from + (here ? " This replaces " + here.name + "'s desktop on this device." : " This replaces all GM data on this device."),
        { marginTop: "12px", color: "var(--text2)" }));
      kids.push(el("div.row.wrap", { style: { gap: "8px" } }, [
        EN.ui.armButton("gmimport", { label: "⤒ REPLACE GM DATA", armedLabel: here ? "SURE? REPLACES THIS DESKTOP" : "SURE? REPLACES ALL GM DATA", onArm: repaint,
          title: here ? "Replace this desktop's GM data with the file" : "Replace this device's GM data with the file",
          armedTitle: here ? "Click again to replace " + here.name + "'s desktop with the file." : "Click again to replace all GM data on this device with the file.",
          onConfirm: importData }),
        el("button.btn.sm", { title: "Forget the picked file", onclick: function () { _import = null; if (EN.ui.disarm) EN.ui.disarm(); repaint(); } }, "CANCEL")
      ]));
    }
    return EN.ui.panel("Back up and restore", null, kids);
  }

  /* ---- work from before this campaign had a desktop, and desktops left on this device ---- */
  function movePanel() {
    var G = EN.gmStore, here = G.desk ? G.desk() : null, kids = [];
    // this device's own desktop still holds work, and this tab is on a campaign it could go to
    var held = here && G.deviceHolds ? G.deviceHolds() : null;
    if (held) {
      kids.push(lbl("Work on this device"));
      kids.push(el("p.help", { dataset: { gm: "move-held" }, style: { margin: "0 0 8px" }, text: "This device's own desktop holds " + G.countText(held) + ". Moving it never writes over anything here, and a copy of the old document is kept first." }));
      kids.push(el("div.row.wrap", { style: { gap: "8px" } }, [
        EN.ui.armButton("gmmove", { label: "MOVE IT TO " + here.name.toUpperCase(), armedLabel: "SURE? MOVES IT TO THIS CAMPAIGN", onArm: repaint,
          title: "Move this device's own desktop into " + here.name, armedTitle: "Click again to move it. The shared threats and hazards stay shared.",
          onConfirm: function () {
            var res = EN.campaigns.moveInto(here.id);
            repaint();
            toast(EN.campaigns.moveWords(res));
          } })
      ]));
    }
    var before = G.premove ? G.premove() : null;
    if (before) {
      kids.push(lbl("From before the last move", !!kids.length));
      kids.push(el("p.help", { dataset: { gm: "premove" }, style: { margin: "0 0 8px" }, text: "The document as it stood on " + new Date(before.at).toLocaleDateString() + ", in case a move took something you wanted to stay." }));
      kids.push(el("div.row.wrap", { style: { gap: "8px" } }, [
        el("button.btn.sm", { dataset: { gm: "premove-export" }, title: "Download it as a .json file you can import", onclick: function () { download(before.text, "before-move"); toast("Exported."); } }, "⤓ EXPORT IT"),
        EN.ui.armButton("gmpremove", { label: "DELETE IT", armedLabel: "SURE? THIS CAN'T BE UNDONE", onArm: repaint,
          title: "Delete this copy", armedTitle: "Click again to delete this copy from this device.",
          onConfirm: function () { G.dropPremove(); repaint(); } })
      ]));
    }
    // jacked out, nothing says which campaigns this account runs, so nothing can be called left behind and offered for deleting
    var running = EN.campaigns && EN.campaigns.running ? EN.campaigns.running() : [];
    var signedIn = !!(EN.campaigns && EN.campaigns.enabled && EN.campaigns.enabled());
    var left = signedIn && G.leftBehind ? G.leftBehind(running.map(function (c) { return c.id; })) : [];
    if (left.length) {
      kids.push(lbl("Other desktops on this device", !!kids.length));
      kids.push(help("From campaigns this account isn't running right now. Their work stays here until you delete it."));
      left.forEach(function (d) {
        kids.push(el("p.help", { dataset: { gm: "left-desk" }, style: { margin: "0 0 8px", color: "var(--text2)" }, text: d.name + ": " + G.countText(d.counts) + "." }));
        kids.push(el("div.row.wrap", { style: { gap: "8px", marginBottom: "8px" } }, [
          el("button.btn.sm", { dataset: { gm: "left-export" }, title: "Download this desktop as a .json file you can import", onclick: function () {
            try { download(G.exportLeft(d.id), slug(d.name)); toast("Exported."); } catch (e) { toast("That desktop could not be exported."); }
          } }, "⤓ EXPORT"),
          EN.ui.armButton("gmleft:" + d.id, { label: "DELETE", armedLabel: "SURE? THIS CAN'T BE UNDONE", onArm: repaint,
            title: "Delete this desktop from this device", armedTitle: "Click again to delete " + d.name + "'s desktop from this device.",
            onConfirm: function () { G.dropLeft(d.id); repaint(); } })
        ]));
      });
    }
    return kids.length ? EN.ui.panel("On this device", null, kids) : null;
  }

  // the DATA page, nested under Sysop's own heading
  function renderData(mount) {
    EN.ui.clear(mount);
    var G = EN.gmStore;
    if (!G || !G.exportDoc) {
      mount.appendChild(el("div.muted-box", { style: { padding: "26px" }, text: "The GM store did not load." }));
      return;
    }
    var blocks = [syncPanel(), backupPanel(), movePanel()].filter(Boolean), kids = [];
    blocks.forEach(function (b, i) { if (i) kids.push(el("div", { style: { height: "12px" } })); kids.push(b); });
    mount.appendChild(el("div", null, kids));
  }

  // a picked file is dropped when the tab is left, so its text is not held
  function reset() { _import = null; }

  return { renderData: renderData, reset: reset };
})();
