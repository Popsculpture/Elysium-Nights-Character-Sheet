/* =========================================================================
   #GRID OS · quickstart.js
   The Quick-Start Rules (EN1003) switch. Unlike the Freelancer's Companion
   (js/packs.js) there is no gate: the content ships in the public app, open to
   everyone, and is simply left out until a device turns it on. The setting is
   EN.launch.quickstart() (data/launch.js), off by default; Settings flips it
   with EN.launch.setQuickstart(on), which calls apply() here.

   WHAT IT MERGES, while the setting is on:
     EN.quickstart.premades  (data/quickstart_premades.js)
                             appended to EN.examples, so the gate's pre-made
                             grid, the On File switcher, Manage characters and
                             '98's Start menu offer them with no code of their
                             own. Each is marked book: "quickstart".
     EN.quickstart.threats   (data/quickstart_threats.js)
                             { category, subgroups, entries }: the category is
                             appended to EN.bestiary.categories and the entries
                             to EN.bestiary.entries, so the Bestiary tab, the
                             encounter builder and the Codex's Bestiary list
                             them in a category of their own.
   The job, The Fifth Flavor, is a Codex chapter (js/codex_quickstart.js) whose
   panels ask EN.launch.quickstart() in their own `when`, so nothing merges it.

   Off takes exactly what it added back out, by reference, so turning it on and
   off again leaves EN.examples and EN.bestiary as the data files built them.
   A pre-made the player saved as their own (SAVE AS MY OWN) is an ordinary
   Handbook record in the roster and stays either way; the one live pre-made
   copy, if it is a Quick-Start one, is dropped by EN.store.relock().

   WHERE IT RUNS. After every data file and js/packs.js, before the engine and
   the store, so a device with the switch on has the pre-mades in EN.examples
   before store.load() looks for the last example it showed.
   ES5 throughout, like the rest of the app.
   ========================================================================= */
window.EN = window.EN || {};

EN.quickstartContent = (function () {
  "use strict";
  var added = null;   // { examples: [...], categories: [...], subgroups: [...], entries: [...] } while merged

  function on() { return !!(EN.launch && EN.launch.quickstart && EN.launch.quickstart()); }
  function data() { return EN.quickstart || {}; }

  function removeAll(arr, items) {
    if (!arr || !items || !items.length) return;
    for (var i = arr.length - 1; i >= 0; i--) if (items.indexOf(arr[i]) !== -1) arr.splice(i, 1);
  }

  function merge() {
    var Q = data(), rec = { examples: [], categories: [], subgroups: [], entries: [] };
    if (EN.examples && Q.premades && Q.premades.length) {
      var have = {};
      EN.examples.forEach(function (x) { have[x.key] = true; });
      Q.premades.forEach(function (x) {
        if (!x || !x.key || have[x.key]) return;   // never shadow a pre-made already listed
        x.book = "quickstart";
        EN.examples.push(x);
        rec.examples.push(x);
      });
    }
    var T = Q.threats, B = EN.bestiary;
    if (B && T) {
      if (T.category && B.categories) { B.categories.push(T.category); rec.categories.push(T.category); }
      (T.subgroups || []).forEach(function (g) { if (B.subgroups) { B.subgroups.push(g); rec.subgroups.push(g); } });
      (T.entries || []).forEach(function (e) { if (B.entries) { B.entries.push(e); rec.entries.push(e); } });
    }
    added = rec;
  }

  function unmerge() {
    if (!added) return;
    removeAll(EN.examples, added.examples);
    var B = EN.bestiary;
    if (B) {
      removeAll(B.categories, added.categories);
      removeAll(B.subgroups, added.subgroups);
      removeAll(B.entries, added.entries);
    }
    added = null;
  }

  /* apply(): make the merge match the setting. Quiet at boot (no store, no
     app yet); after a change it re-resolves the roster, refreshes the Codex
     index and redraws, the way a pack merge does. */
  function apply() {
    var want = on();
    if (want === !!added) return false;
    if (want) merge(); else unmerge();
    if (EN.codexView && EN.codexView.refresh) { try { EN.codexView.refresh(); } catch (e) { console.error(e); } }
    if (EN.store && EN.store.relock) { try { EN.store.relock(); } catch (e) { console.error("Re-resolving the roster failed", e); } }
    if (EN.app && EN.app.render) { try { EN.app.render(); } catch (e) { console.error(e); } }
    return true;
  }

  // boot: the store and the app have not loaded, so this only merges
  if (on()) merge();

  return { apply: apply, merged: function () { return !!added; },
           isQuickstart: function (x) { return !!(x && x.book === "quickstart"); } };
})();
