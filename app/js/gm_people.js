/* ===========================================================================
   ELYSIUM NIGHTS · GM People (Admin tab)
   People who aren't in initiative: the bartender, the claims agent, the
   steward who remembers a face. This tab keeps their contact cards, rolls
   them a name and a street handle, and turns one into a threat when the
   talking stops. Every word of the book is EN.gmBook.people
   (data/gm_people.js): this file decides which row and keeps the GM's cards,
   never what a row says.

   What the book leaves to the table, and what this file does about it (app
   readings, not rules):
     - A card is written in pencil, so every line is free text. A walk-on is a
       card with only its first three lines; the header counts the lines
       filled, so a card that has mattered twice says so.
     - Resolve is picked the way the book says, by the closest job in Resolve
       by Role, and can be moved to another tier. A moved card asks for the
       reason ("it's usually their Fear") and offers the Fear line for it.
       Apex prints "16+", so an Apex card takes a number of 16 or more. The
       line is kept the way the threat blocks write it, "5 (Standard)", so
       PROMOTE TO THREAT carries it across unchanged.
     - Their Profile of You: the d12, a pick of the twelve, one of the four
       Profiles the book says are earned in play (picked, never rolled), or
       one written in play.
     - Weak spots: one Approach that deals double Pressure and one that deals
       none, each with its reason. The Approaches are the Sit-Down's that deal
       Pressure (EN.gmBook.scenes.sitdown.weakSpots when it loaded; Insight
       never moves Resolve).
     - The name tables are d20 pairs (see data/gm_people.js): one roll reads
       one printed row. A row is shown as its table's `combine` says: joined
       into one name (Humans, Verdine, Chimera); a formal name and a trusted
       name kept apart (Clankers, whose trusted name is a street handle, so
       USE files it as the card's handle); or a name and where it came from
       (Outsiders, never split). Street Handles is one d20 over twenty. A
       roll of several at once rerolls a repeat inside the batch, so five
       rolls offer five names.
     - USE puts a rolled or picked name on the card in the editor (a blank
       editor is a new card), and the table it came from sets the species.
     - PROMOTE TO THREAT builds the block with the Threats builder's own
       engine (EN.gmEngine.buildThreat): the crew's Caliber as its Grade,
       Standard and Gunhand (the builder's defaults) unless the GM picks
       otherwise, the contact's species' Species Template laid over it
       (traits added, nothing else changed) and that species as its Type, the
       Work line ahead of its identity, and the Resolve line carried across as
       `resolve` (the field the Threats card prints on its Resolve line). SAVE
       AS A THREAT files it under the Threats tab's Saved Threats; + ENCOUNTER
       PLAN hands it to Encounters as a threat line.
     - A threat the crew talks down picks up a card the same way: any Bestiary
       entry that prints Resolve, or a saved threat that carries one, starts a
       card with its name and its Resolve line.

   A contact record (GM bag `contacts`):
     { id, name, print, handle, nameNote, species, work, want, fear,
       resolveTier, resolveValue, resolve, resolveRole, resolveWhy, resolveNote,
       profile, profileN, tell,
       weak: { double, doubleWhy, none, noneWhy },
       notes, fromThreat, example, createdAt, updatedAt }
   `print` is the #PRINT name when it differs, `handle` the street handle,
   `nameNote` where an Outsider's city name came from, `species` an EN.species
   key or "". `resolveTier` is a Resolve by Role tier key ("" for none),
   `resolveValue` its number (16 or more at Apex) and `resolve` the line as
   the threat blocks write it, "5 (Standard)", kept in step on every save for
   any reader that wants the line. `resolveRole` is the printed role it was
   picked by, and `resolveWhy` the reason a card was moved off that role's
   tier. `resolveNote` is a qualifier printed after the tier, as the Bestiary
   prints one ("5 (Standard; Iron against anything that would make them
   break their word)"), and rides in `resolve` after a ";".
   `profile` is a Profile's name and `profileN` its d12 row (null when
   it is not one of the twelve). Weak spots hold Approach keys, or "".
   `fromThreat` names the Bestiary entry or saved threat a card came from, and
   `example` is the book example's key when the card was loaded from it. A
   record missing any of these reads as blank (one carrying only `resolve`
   reads its tier from that line), so a card another tab saved still opens.

   Writes nothing to a Freelancer's record: the contacts are the GM's own.
   A handoff of {contactId} opens that contact, unless the card in the editor
   has unsaved changes.
   =========================================================================== */
window.EN = window.EN || {};

EN.gmPeople = (function () {
  var el = EN.ui.el, toast = EN.ui.toast, gm = EN.gmStore;
  var BAG = "contacts";
  // the Sit-Down Approaches that deal Pressure, used only when the Scenes data
  // has not loaded (js/face.js lists all five; Insight deals none)
  var APPROACHES = [
    { key: "persuasion", name: "Persuasion" }, { key: "intimidation", name: "Intimidation" },
    { key: "performance", name: "Performance" }, { key: "deception", name: "Deception" }
  ];
  var COUNTS = [1, 3, 5, 10];
  // the text fields of a contact record, kept as typed in the editor and trimmed on save
  var TEXT = ["name", "print", "handle", "nameNote", "work", "want", "fear", "resolveRole", "resolveWhy", "resolveNote",
              "profile", "tell", "notes", "fromThreat"];

  function blankDraft() {
    return { id: null, name: "", print: "", handle: "", nameNote: "", species: "",
             work: "", want: "", fear: "",
             resolveTier: "", resolveValue: null, resolveRole: "", resolveWhy: "", resolveNote: "",
             profile: "", profileN: null, tell: "",
             weak: { double: "", doubleWhy: "", none: "", noneWhy: "" },
             notes: "", fromThreat: "", example: "" };
  }

  /* Transient UI state, deliberately not persisted, like the Job Board's card:
     the editor is a working surface and the contacts bag is where a card is
     kept. Survives a tab switch, since this is still one module.
     `customProfile` is the Profile select sitting on "written in play".
     `promote.grade` null follows the crew's Caliber; `promote.type` and
     `promote.template` null follow the card's species ("none" is no template). */
  var _p = {
    draft: blankDraft(),
    customProfile: false,
    roll: { table: "humans", count: 3, results: [], showTable: false },
    promote: { grade: null, designation: "standard", role: "gunhand", type: null, template: null },
    fromThreat: "",
    q: ""
  };
  var _crew = null;       // EN.gmEngine.crew(), read once per render
  /* What follows the GM's typing without a re-render (F19): the card's header
     tags and actions, its text, the Resolve line, the promote preview, the
     roller's USE line and the contacts list. A re-render on change would swap
     out the button under the pointer, so the first click after typing would
     never land. */
  var _paint = null;

  /* ---- small helpers, local per the house convention ----------------------- */
  function own(o, k) { return !!o && Object.prototype.hasOwnProperty.call(o, k); }
  function copy(v) { return v == null ? v : JSON.parse(JSON.stringify(v)); }
  function str(v) { return typeof v === "string" ? v : (v == null ? "" : String(v)); }
  function trim(v) { return str(v).replace(/^\s+|\s+$/g, ""); }
  function die(sides) { return 1 + Math.floor(Math.random() * sides); }
  function lbl(t) { return el("label.fl", { text: t }); }
  function book() { return (EN.gmBook && EN.gmBook.people) || null; }
  function gap() { return el("div", { style: { height: "12px" } }); }
  function fieldHead(t, color) {
    return el("div.mono", { style: { fontSize: "10px", letterSpacing: ".14em", color: color || "var(--text3)", margin: "14px 0 2px" }, text: t });
  }
  function tag(t, color) {
    return el("span.chip", { style: { fontSize: "9.5px", color: color || "var(--text3)", borderColor: color || "var(--border2)" }, text: t });
  }
  function refill(node, kids) {
    if (!node || !node.isConnected) return;
    EN.ui.clear(node);
    kids.forEach(function (k) { if (k) node.appendChild(k); });
  }
  // "weak.doubleWhy" style paths into the draft, for the inputs that share one builder
  function getPath(o, path) {
    var parts = path.split("."), v = o;
    for (var i = 0; i < parts.length; i++) v = (v && typeof v === "object") ? v[parts[i]] : undefined;
    return v;
  }
  function setPath(o, path, val) {
    var parts = path.split("."), t = o;
    for (var i = 0; i < parts.length - 1; i++) t = t[parts[i]];
    t[parts[parts.length - 1]] = val;
  }

  /* COPY. The clipboard API first; a hidden textarea and execCommand where the
     API is missing or refuses (a file:// page can be either). Either way the
     text is on screen beside the button, so a blocked copy is never a lost one. */
  function copyText(text, what) {
    function fallback() {
      var ta = el("textarea", { value: text, style: { position: "fixed", top: "-1000px", left: "0", opacity: "0" } });
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      toast(ok ? what + " copied." : "The browser blocked the copy. Select the text beside the button instead.");
    }
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { toast(what + " copied."); }, fallback);
        return;
      }
    } catch (e) {}
    fallback();
  }

  /* ---- the book's tables ---------------------------------------------------- */
  function lineOf(field) {
    var B = book();
    return ((B && B.card && B.card.lines) || []).filter(function (l) { return l.field === field; })[0] ||
           { field: field, line: field, holds: "" };
  }
  function tiers() { var B = book(); return (B && B.resolveByRole && B.resolveByRole.tiers) || []; }
  function tierOf(key) { return tiers().filter(function (t) { return t.key === key; })[0] || null; }
  // the tier a printed role sits at
  function roleTier(role) {
    var r = trim(role);
    if (!r) return null;
    return tiers().filter(function (t) { return (t.roles || []).indexOf(r) !== -1; })[0] || null;
  }
  function resolveNum(d) {
    var t = tierOf(d.resolveTier);
    if (!t) return null;
    if (!t.orMore) return t.value;
    var v = Math.floor(Number(d.resolveValue));
    return (isFinite(v) && v >= t.value) ? v : t.value;
  }
  /* The line as the threat blocks write it: "5 (Standard)", with the card's
     qualifier after the tier the way the Bestiary prints one: "5 (Standard;
     Iron against anything that would make them break their word)". */
  function resolveLine(d) {
    var t = tierOf(d.resolveTier), q = trim(d.resolveNote);
    return t ? resolveNum(d) + " (" + t.tier + (q ? "; " + q : "") + ")" : "";
  }
  // the number and the tier alone, for the contact's tag
  function resolveShort(d) {
    var t = tierOf(d.resolveTier);
    return t ? resolveNum(d) + " (" + t.tier + ")" : "";
  }
  /* A printed Resolve line ("8 (Hardened)", "16 (Apex)", or a bare number)
     read back into a tier and a number: the tier by its name, else the
     highest tier the number reaches. The tier's name is what comes before the
     first ";" in the brackets; what follows it is the qualifier (`note`):
     "8 (Hardened; double Pressure from ..., none from Intimidation. ...)". */
  function parseResolve(s) {
    var m = str(s).match(/(\d+)\s*\+?\s*(?:\((.*)\))?/);
    if (!m) return null;
    var inner = str(m[2]), cut = inner.indexOf(";");
    var v = Number(m[1]), name = trim(cut === -1 ? inner : inner.slice(0, cut)).toLowerCase(), t = null;
    var note = cut === -1 ? "" : trim(inner.slice(cut + 1));
    tiers().forEach(function (x) { if (x.tier.toLowerCase() === name) t = x; });
    if (!t) tiers().forEach(function (x) { if (v >= x.value) t = x; });
    return t ? { tier: t.key, value: t.orMore ? Math.max(v, t.value) : t.value, note: note } : null;
  }
  /* The weak spots a printed qualifier names: "double Pressure from X" and
     "none from Y", each taken only where X or Y starts with the name of an
     Approach that deals Pressure ("Insight-driven approaches" names none,
     since Insight never moves Resolve). The reason is the qualifier's other
     sentences ("They have already imagined worse than the crew"). */
  function weakFromNote(note) {
    var s = str(note), out = { double: "", none: "", why: "" };
    function ap(phrase) {
      var p = trim(phrase).toLowerCase(), hit = "";
      approaches().forEach(function (a) {
        var n = a.name.toLowerCase();
        if (!hit && p.indexOf(n) === 0 && !/[a-z]/.test(p.charAt(n.length))) hit = a.key;
      });
      return hit;
    }
    var md = s.match(/\bdouble(?:\s+Pressure)?\s+from\s+([^,.;]+)/i), mn = s.match(/\bnone\s+from\s+([^,.;]+)/i);
    if (md) out.double = ap(md[1]);
    if (mn) out.none = ap(mn[1]);
    if (out.double && out.double === out.none) out.double = "";
    if (out.double || out.none) {
      out.why = s.split(/\.\s+/).filter(function (x) { return !/\b(double|none)\b[^.]*\bfrom\b/i.test(x); })
        .map(function (x) { return trim(x).replace(/\.$/, ""); }).filter(Boolean).join(". ");
    }
    return out;
  }

  function profiles() { var B = book(); return (B && B.profiles) || { rows: [], earned: { names: [] } }; }
  function profileRow(n) { return (profiles().rows || []).filter(function (r) { return r.n === n; })[0] || null; }
  function earnedName(name) {
    var k = trim(name).toLowerCase();
    return ((profiles().earned && profiles().earned.names) || []).filter(function (n) { return n.toLowerCase() === k; })[0] || null;
  }

  function approaches() {
    var S = EN.gmBook && EN.gmBook.scenes && EN.gmBook.scenes.sitdown;
    var A = S && S.weakSpots && S.weakSpots.approaches;
    return (A && A.length) ? A : APPROACHES;
  }
  function approachName(k) {
    var a = approaches().filter(function (x) { return x.key === k; })[0];
    return a ? a.name : "";
  }

  function names() { var B = book(); return (B && B.names) || { tables: [] }; }
  function nameTable(key) { return (names().tables || []).filter(function (t) { return t.key === key; })[0] || null; }
  function handles() { var B = book(); return (B && B.handles) || null; }
  function speciesTable(k) { return k ? ((names().tables || []).filter(function (t) { return t.speciesKey === k; })[0] || null) : null; }
  function speciesName(k) { var t = speciesTable(k); return t ? t.name : ""; }

  /* ---- a contact as a draft, and back ---------------------------------------- */
  function draftOf(r) {
    var d = blankDraft();
    if (!r || typeof r !== "object") return d;
    d.id = (typeof r.id === "string" && r.id) ? r.id : null;
    TEXT.forEach(function (k) { d[k] = str(r[k]); });
    d.example = str(r.example);
    d.species = speciesTable(str(r.species)) ? str(r.species) : "";
    if (tierOf(str(r.resolveTier))) {
      d.resolveTier = str(r.resolveTier);
      d.resolveValue = typeof r.resolveValue === "number" ? r.resolveValue : null;
    } else if (trim(r.resolve)) {
      // a card that carries only the printed line reads its tier from it
      var pr = parseResolve(r.resolve);
      if (pr) { d.resolveTier = pr.tier; d.resolveValue = pr.value; if (!trim(d.resolveNote)) d.resolveNote = pr.note; }
    }
    d.profileN = (typeof r.profileN === "number" && profileRow(r.profileN)) ? r.profileN : null;
    var w = (r.weak && typeof r.weak === "object") ? r.weak : {};
    d.weak = { double: approachName(str(w.double)) ? str(w.double) : "", doubleWhy: str(w.doubleWhy),
               none: approachName(str(w.none)) ? str(w.none) : "", noneWhy: str(w.noneWhy) };
    return d;
  }
  // what a card says, as one string, for the unsaved-changes check
  function canon(d) {
    var w = d.weak || {};
    return JSON.stringify(TEXT.map(function (k) { return trim(d[k]); }).concat([
      d.species || "", d.resolveTier || "", resolveNum(d), d.profileN || null,
      w.double || "", trim(w.doubleWhy), w.none || "", trim(w.noneWhy)]));
  }
  var BLANK = null;
  function hasContent(d) {
    if (BLANK === null) BLANK = canon(blankDraft());
    return canon(d) !== BLANK;
  }
  function isDirty(d) {
    if (!d.id) return hasContent(d);
    var r = gm.rec(BAG, d.id);
    return !r || canon(draftOf(r)) !== canon(d);
  }
  /* The record for the card. Starts from the stored copy, so a field another
     tab or a later build sets on a contact comes through a save untouched. */
  function recordOf(d) {
    var r = (d.id && copy(gm.rec(BAG, d.id))) || {};
    if (d.id) r.id = d.id;
    TEXT.forEach(function (k) { r[k] = trim(d[k]); });
    r.species = d.species || "";
    r.resolveTier = tierOf(d.resolveTier) ? d.resolveTier : "";
    r.resolveValue = resolveNum(d);
    r.resolve = resolveLine(d);
    r.profileN = d.profileN || null;
    r.weak = { double: d.weak.double || "", doubleWhy: trim(d.weak.doubleWhy),
               none: d.weak.none || "", noneWhy: trim(d.weak.noneWhy) };
    r.example = d.example || "";
    return r;
  }
  function save(d, quiet) {
    if (!hasContent(d)) return null;
    var id = gm.put(BAG, recordOf(d));
    if (id) {
      d.id = id;
      if (!quiet) toast((trim(d.name) || "The card") + " saved to the contacts.");
    } else if (!quiet) toast("The card could not be saved.");
    return id;
  }
  function setDraft(d) {
    _p.draft = d;
    _p.customProfile = !!(trim(d.profile) && !d.profileN && !earnedName(d.profile));
    _p.promote.type = null;
    _p.promote.template = null;
  }
  function openContact(id) {
    var r = gm.rec(BAG, id);
    if (!r) return false;
    setDraft(draftOf(r));
    return true;
  }
  // a card whose record was deleted elsewhere stays in the editor, as a card not yet saved
  function syncDraft() {
    var d = _p.draft;
    if (d.id && !gm.rec(BAG, d.id)) d.id = null;
  }

  /* ---- the card as text ------------------------------------------------------
     The way the book prints its example: the name with its #PRINT in
     brackets, then one labelled line each. */
  function nameLine(d) {
    var n = trim(d.name) || "Unnamed contact", p = trim(d.print);
    return n + (p ? " (#PRINT: " + p + ")" : "");
  }
  // the way the book's Thirty Days example writes them: "Persuasion deals double (the reason)."
  function weakText(d) {
    var w = d.weak || {}, out = [];
    function why(t) { t = trim(t).replace(/\.$/, ""); return t ? " (" + t + ")" : ""; }
    if (w.double) out.push(approachName(w.double) + " deals double" + why(w.doubleWhy) + ".");
    if (w.none) out.push(approachName(w.none) + " deals none" + why(w.noneWhy) + ".");
    return out.join(" ");
  }
  // a printed role inside a sentence: "a claims agent", without its closing period
  function roleInline(role) {
    var r = trim(role).replace(/\.$/, "");
    return r.charAt(0).toLowerCase() + r.slice(1);
  }
  function movedText(d) {
    var t = tierOf(d.resolveTier), rt = roleTier(d.resolveRole);
    if (!t || !rt || rt === t) return "";
    var why = trim(d.resolveWhy);
    var s = "Moved from " + rt.tier + " (" + roleInline(d.resolveRole) + ")" + (why ? ": " + why : "");
    return /[.!?]$/.test(s) ? s : s + ".";
  }
  function cardText(d) {
    var out = [nameLine(d)];
    if (trim(d.handle)) out.push("Handle: " + trim(d.handle));
    if (trim(d.nameNote)) out.push("Where the name came from: " + trim(d.nameNote));
    if (d.species) out.push("Species: " + speciesName(d.species));
    ["work", "want", "fear"].forEach(function (k) { if (trim(d[k])) out.push(lineOf(k).line + ": " + trim(d[k])); });
    var rl = resolveLine(d);
    if (rl) out.push(lineOf("resolve").line + ": " + rl + "." + (movedText(d) ? " " + movedText(d) : ""));
    if (trim(d.profile)) out.push(lineOf("profile").line + ": " + trim(d.profile).replace(/\.$/, "") + ".");
    if (trim(d.tell)) out.push(lineOf("tell").line + ": " + trim(d.tell));
    if (weakText(d)) out.push("Weak spots: " + weakText(d));
    if (trim(d.notes)) out.push("Notes: " + trim(d.notes));
    return out.join("\n");
  }
  // how many of the seven lines hold something, and what that makes the card
  function filled(d, field) {
    if (field === "resolve") return !!tierOf(d.resolveTier);
    return !!trim(d[field]);
  }
  function cardState(d) {
    var B = book(), lines = (B && B.card && B.card.lines) || [];
    var walk = (B && B.card && B.card.walkOnCount) || 3;
    var n = 0, rest = 0;
    lines.forEach(function (l, i) { if (filled(d, l.field)) { n++; if (i >= walk) rest++; } });
    if (lines.length && n === lines.length) return { key: "full", label: "FULL CARD", n: n, of: lines.length };
    if (n && !rest) return { key: "walkon", label: "WALK-ON", n: n, of: lines.length };
    return { key: "partial", label: n + " OF " + lines.length + " LINES", n: n, of: lines.length };
  }

  /* ---- the name roller ------------------------------------------------------- */
  function resultOf(key, n) {
    if (key === "handles") {
      var H = handles();
      var hr = H ? (H.rows || []).filter(function (r) { return r.n === n; })[0] : null;
      return hr ? { table: "handles", n: n, combine: "handle", a: hr.text, b: "" } : null;
    }
    var T = nameTable(key);
    var r = T ? (T.rows || []).filter(function (x) { return x.n === n; })[0] : null;
    return r ? { table: key, n: n, combine: T.combine || "joined", a: r.a, b: r.b } : null;
  }
  function tableName(key) {
    if (key === "handles") { var H = handles(); return H ? H.title : "Street Handles"; }
    var T = nameTable(key);
    return T ? T.name : "";
  }
  // a rolled row as the GM reads it, by its table's `combine`
  function resultText(r) {
    if (r.combine === "joined") return r.a + " " + r.b;
    if (r.combine === "apart") {
      var cols = (nameTable(r.table) || {}).columns || ["Formal Name", "Trusted Name"];
      return r.a + " (" + String(cols[0]).toLowerCase() + "), " + r.b + " (" + String(cols[1]).toLowerCase() + ")";
    }
    if (r.combine === "explained") return r.a + ": " + r.b;
    return r.a;
  }
  /* Several at once: each a d20, and a repeat inside the batch is rolled again
     while the table still has rows left, so a batch of five is five names. */
  function rollBatch() {
    var R = _p.roll, key = R.table;
    var rows = key === "handles" ? ((handles() || {}).rows || []) : ((nameTable(key) || {}).rows || []);
    if (!rows.length) return;
    var count = Math.max(1, Math.min(COUNTS[COUNTS.length - 1], Number(R.count) || 1));
    var seen = Object.create(null), out = [];
    for (var i = 0; i < count; i++) {
      var n = die(20), guard = 0;
      while (seen[n] && guard++ < 200 && out.length < rows.length) n = die(20);
      seen[n] = true;
      var r = resultOf(key, n);
      if (r) out.push(r);
    }
    R.results = out;
    toast(out.length === 1 ? "Rolled " + out[0].n + ": " + resultText(out[0]) + "." : "Rolled " + out.length + " on " + tableName(key) + ".");
    EN.app.render();
  }
  /* USE: the row onto the card in the editor. A name replaces the card's name
     (and its species follows the table); a Clanker's trusted name and a
     street handle become the handle; an Outsider's story stays beside its name. */
  function useResult(r) {
    var d = _p.draft, T = r.table === "handles" ? null : nameTable(r.table);
    if (r.combine === "handle") {
      d.handle = r.a;
      toast("Handle on the card: " + r.a + ".");
    } else {
      var was = trim(d.name);
      if (r.combine === "apart") { d.name = r.a; d.handle = r.b; d.nameNote = ""; }
      else if (r.combine === "explained") { d.name = r.a; d.nameNote = r.b; }
      else { d.name = r.combine === "joined" ? r.a + " " + r.b : r.a; d.nameNote = ""; }
      if (T && T.speciesKey) d.species = T.speciesKey;
      toast("Name on the card: " + trim(d.name) + (was && was !== trim(d.name) ? " (was " + was + ")." : "."));
    }
    EN.app.render();
  }

  /* ---- promote to threat ------------------------------------------------------ */
  function crewNow() {
    if (!_crew) {
      try { _crew = EN.gmEngine.crew(); }
      catch (e) { _crew = { members: [], headcount: 0, caliber: 1, source: "none" }; }
    }
    return _crew;
  }
  function promoteGrade() {
    var g = Math.round(Number(_p.promote.grade));
    return (_p.promote.grade != null && g >= 1 && g <= 5) ? g : crewNow().caliber;
  }
  function threatTypes() { return (EN.threats && EN.threats.types) || ["Human"]; }
  // the Threats builder's Type for the card's species: Human for Humans, the template's species name otherwise
  function typeFor(d) {
    var T = speciesTable(d.species), want = (T && T.template) ? T.template : "Human";
    var types = threatTypes();
    return types.indexOf(want) !== -1 ? want : types[0];
  }
  // the GM's pick, else the template's species, else the card's species
  function promoteType(d) {
    var t = _p.promote.type, types = threatTypes();
    if (t && types.indexOf(t) !== -1) return t;
    var tp = promoteTemplate(d);
    return (tp && types.indexOf(tp.species) !== -1) ? tp.species : typeFor(d);
  }
  function templates() {
    var S = EN.bestiary && EN.bestiary.speciesTemplates;
    return (S && S.templates) || [];
  }
  function templateOf(species) { return templates().filter(function (t) { return t.species === species; })[0] || null; }
  function promoteTemplate(d) {
    var t = _p.promote.template;
    if (t === "none") return null;
    if (t && templateOf(t)) return templateOf(t);
    var T = speciesTable(d.species);
    return (T && T.template) ? templateOf(T.template) : null;
  }
  /* A Species Template laid over the block: its traits added, nothing else
     changed (the book's own rule), except where a trait itself names a number,
     as Keen Senses does with Passive Perception. The block takes the same shape
     the Bestiary's overlay gives a People card (gm.js): `species` and
     `speciesClass` on the block, each trait an ability marked with `template`.
     A built block's card (gm.js statblock) prints no abilities, so the traits
     are also written on its Trait line, the blank threat's line for them. */
  function overlay(b, tp) {
    var traits = (tp.traits || []).map(function (a) {
      return { name: a.name, cost: a.cost || null, text: a.text, template: tp.species };
    });
    b.abilities = (Array.isArray(b.abilities) ? b.abilities : []).concat(traits);
    b.species = tp.species;
    b.speciesClass = tp.classification || "";
    traits.forEach(function (a) {
      var m = str(a.text).match(/^([+-]\d+)\s+Passive Perception\b/);
      if (m && typeof b.passivePerception === "number") b.passivePerception += Number(m[1]);
    });
    if (!trim(b.trait)) {
      b.trait = traits.map(function (a) { return a.name + (a.cost ? " (" + a.cost + ")" : "") + ": " + a.text; }).join(" ");
    }
  }
  function buildFor(d) {
    if (!EN.gmEngine || typeof EN.gmEngine.buildThreat !== "function" || !trim(d.name)) return null;
    var inputs = { grade: promoteGrade(), designation: _p.promote.designation, role: _p.promote.role,
                   size: "Medium", type: promoteType(d), name: trim(d.name), strong: null };
    var b = null;
    try { b = EN.gmEngine.buildThreat(inputs); } catch (e) { b = null; }
    if (!b) return null;
    var work = trim(d.work);
    if (work) b.identity = work + (/[.!?]$/.test(work) ? " " : ". ") + (b.identity || "");
    var rl = resolveLine(d);
    if (rl) b.resolve = rl;
    var tp = promoteTemplate(d);
    if (tp) overlay(b, tp);
    if (d.id) b.fromContact = d.id;
    return { block: b, inputs: inputs };
  }
  function promoteToThreats() {
    var x = buildFor(_p.draft);
    if (!x) { toast("Give the contact a name first."); return; }
    gm.saveThreat(x.block, x.inputs);
    toast(x.block.name + " saved as a threat" + (x.block.resolve ? ", Resolve " + x.block.resolve : "") + ". It is under Saved Threats.");
    if (EN.app && typeof EN.app.gotoTab === "function") EN.app.gotoTab("threats");
    else EN.app.render();
  }
  function promoteToPlan() {
    var x = buildFor(_p.draft);
    if (!x) { toast("Give the contact a name first."); return; }
    if (EN.gmView && typeof EN.gmView.handoff === "function") {
      EN.gmView.handoff("encounters", { addLines: [{ kind: "threat", block: x.block, inputs: x.inputs, count: 1 }], note: "" });
    }
  }

  /* ---- a card from a threat ----------------------------------------------------
     A threat the crew talks down picks up a card: the Bestiary entries that
     print Resolve, and saved threats that carry one. */
  function threatSources() {
    var out = [];
    ((EN.bestiary && EN.bestiary.entries) || []).forEach(function (e) {
      var r = e && e.stats && e.stats.Resolve;
      if (r) out.push({ key: "b:" + e.name, group: "Bestiary", label: e.name + ", Resolve " + r, name: e.name, resolve: r, template: null });
    });
    ((gm.savedThreats && gm.savedThreats()) || []).forEach(function (t) {
      var b = (t && t.block) || {};
      if (b.resolve) out.push({ key: "t:" + t.id, group: "Saved threats", label: (b.name || "Unnamed") + ", Resolve " + b.resolve,
                                name: b.name || "", resolve: b.resolve, template: b.species || null });
    });
    return out;
  }
  function draftFromThreat(src) {
    var d = blankDraft();
    d.name = src.name;
    d.fromThreat = src.name;
    var pr = parseResolve(src.resolve);
    if (pr) {
      d.resolveTier = pr.tier; d.resolveValue = pr.value;
      // the printed qualifier rides on the Resolve line unchanged, and a weak spot it names fills that line too
      d.resolveNote = pr.note;
      var w = weakFromNote(pr.note);
      ["double", "none"].forEach(function (k) { if (w[k]) { d.weak[k] = w[k]; d.weak[k + "Why"] = w.why; } });
    }
    if (src.template) {
      var T = (names().tables || []).filter(function (x) { return x.template === src.template; })[0];
      if (T) d.species = T.speciesKey;
    }
    return d;
  }

  /* ---- the GM's Card and the undo strip, as every Admin tab draws them ---------- */
  // the GM'S CARD button beside the heading, when gm.js offers one
  function cardButton() {
    try {
      if (EN.gmView && typeof EN.gmView.cardDrawer === "function") {
        var n = EN.gmView.cardDrawer();
        return (n && n.nodeType) ? n : null;
      }
    } catch (e) {
      try { console.warn("GM People: the GM's Card button failed to draw.", e); } catch (e2) {}
    }
    return null;
  }
  // the same heading every Admin tab draws for itself (see gm.js)
  function heading(title, sub) {
    return el("div.row.between.wrap", { style: { marginBottom: "14px", gap: "8px", alignItems: "center" } }, [
      el("h1", { style: { fontSize: "22px", letterSpacing: ".06em" },
        html: title + ' <span class="dim3" style="font-size:13px">' + sub + "</span>" }),
      cardButton()
    ]);
  }
  // the newest standing GM write with its armed UNDO, as every Admin tab shows it
  function undoStrip() {
    try {
      return (EN.gmView && typeof EN.gmView.undoStrip === "function") ? (EN.gmView.undoStrip() || null) : null;
    } catch (e) {
      try { console.error("GM People: the undo strip failed", e); } catch (e2) {}
      return null;
    }
  }

  /* ---- the card editor --------------------------------------------------------- */
  // no re-render on change: the state is kept on input and what depends on it is repainted in place (F19)
  function input(path, ph, opts) {
    opts = opts || {};
    var d = _p.draft;
    return el(opts.area ? "textarea" : "input", {
      type: opts.area ? null : "text", value: str(getPath(d, path)), placeholder: ph || "",
      title: opts.title || null, dataset: { pf: path },
      style: opts.area ? { width: "100%", minHeight: "64px", fontSize: "13px" } : { width: "100%" },
      oninput: function (e) {
        setPath(d, path, e.target.value);
        if (opts.after) opts.after(e.target.value);
        paintLive();
      } });
  }
  function field(label, node, flex) {
    return el("div.field", { style: { margin: 0, flex: flex || "1 1 220px", minWidth: "0" } }, [lbl(label), node]);
  }
  function fieldRow(kids) {
    return el("div.row.wrap", { style: { gap: "10px", alignItems: "flex-end", marginTop: "8px" } }, kids);
  }
  // `area` for the lines that run to a sentence or two (a Tell usually does)
  function lineField(field_, area) {
    var L = lineOf(field_);
    var node = input(field_, L.holds, { title: L.holds, area: !!area });
    if (area) node.style.minHeight = "46px";
    return fieldRow([field(L.line, node, "1 1 100%")]);
  }
  function selectEl(path, opts, cur, onPick, style) {
    return el("select", { dataset: { pf: path }, style: style || { width: "100%", maxWidth: "100%" },
      onchange: function (e) { onPick(e.target.value); EN.app.render(); } },
      opts.map(function (o) {
        if (o.group) {
          return el("optgroup", { label: o.group }, o.items.map(function (x) {
            return el("option", { value: x.value, selected: x.value === cur }, x.label);
          }));
        }
        return el("option", { value: o.value, selected: o.value === cur }, o.label);
      }));
  }

  function speciesSelect() {
    var d = _p.draft;
    var opts = [{ value: "", label: "Not set" }].concat((names().tables || []).map(function (t) {
      return { value: t.speciesKey, label: t.name };
    }));
    return selectEl("species", opts, d.species || "", function (v) { d.species = speciesTable(v) ? v : ""; });
  }

  function resolveSays(d) {
    var rl = resolveLine(d);
    return rl ? "Writes as the threat blocks do: Resolve " + rl + "." : "No Resolve yet. Pick the closest job, or a tier.";
  }
  function resolveBlock() {
    var B = book(), R = B.resolveByRole || {}, d = _p.draft, t = tierOf(d.resolveTier), rt = roleTier(d.resolveRole);
    var kids = [];
    var roleOpts = [{ value: "", label: "Closest job..." }].concat(tiers().map(function (T) {
      return { group: T.tier + " (" + T.resolve + ")", items: (T.roles || []).map(function (r, i) {
        return { value: T.key + "|" + i, label: r.replace(/\.$/, "") };
      }) };
    }));
    var curRole = "";
    if (rt) curRole = rt.key + "|" + rt.roles.indexOf(trim(d.resolveRole));
    var tierOpts = [{ value: "", label: "No Resolve yet" }].concat(tiers().map(function (T) {
      return { value: T.key, label: T.tier + " " + T.resolve };
    }));
    var row = [
      field("Closest job", selectEl("resolveRole", roleOpts, curRole, function (v) {
        if (!v) { d.resolveRole = ""; return; }
        var parts = v.split("|"), T = tierOf(parts[0]), role = T ? (T.roles || [])[Number(parts[1])] : null;
        if (!role) return;
        // the role is where the number starts: picking one sets its tier
        d.resolveRole = role;
        d.resolveTier = T.key;
        d.resolveValue = T.value;
      }), "2 1 240px"),
      field(lineOf("resolve").line, selectEl("resolveTier", tierOpts, t ? t.key : "", function (v) {
        var T = tierOf(v);
        d.resolveTier = T ? T.key : "";
        d.resolveValue = T ? (T.orMore ? Math.max(T.value, Number(d.resolveValue) || 0) : T.value) : null;
      }), "1 1 150px")
    ];
    // the tier's row in Resolve by Role, in the Codex
    var rc = EN.ui.ruleChip(t ? "gmp-resolve/" + t.key : "gmp-resolve", { title: t ? (R.title || "Resolve by Role") + ": " + t.tier : (R.title || "Resolve by Role") });
    if (rc) row.push(el("div", { dataset: { people: "resolve-rule" }, style: { alignSelf: "flex-end", paddingBottom: "6px" } }, [rc]));
    if (t && t.orMore) {
      row.push(field("Number", el("input", { type: "number", min: String(t.value), step: "1", value: String(resolveNum(d)),
        dataset: { pf: "resolveValue" }, style: { width: "90px" }, title: t.tier + " is " + t.resolve,
        oninput: function (e) {
          var v = Math.floor(Number(e.target.value));
          d.resolveValue = (isFinite(v) && v >= t.value) ? v : t.value;
          paintLive();
        } }), "0 0 100px"));
    }
    kids.push(fieldRow(row));
    // what the Bestiary prints after the tier ("Iron against anything that would make them break their word")
    if (t || trim(d.resolveNote)) {
      kids.push(fieldRow([field("After the tier", input("resolveNote", "A qualifier, as the Bestiary prints one after the tier",
        { title: "Printed on the Resolve line after the tier, and carried to a threat and a Sit-Down" }), "1 1 100%")]));
    }
    var says = el("p.help", { dataset: { live: "resolve-line" }, style: { margin: "5px 0 0", color: t ? "var(--accent)" : "var(--text3)" }, text: resolveSays(d) });
    if (_paint) _paint.resolveLine = says;
    kids.push(says);
    // moved off the role's tier: the book asks for the reason, and it is usually the Fear
    if (t && rt && rt !== t) {
      kids.push(el("p.help", { style: { margin: "6px 0 0", color: "var(--warn)" },
        text: "The role, " + roleInline(d.resolveRole) + ", sits at " + rt.tier + " (" + rt.resolve + "). This card is moved to " + t.tier + "." }));
      var whyRow = [field("Moved because", input("resolveWhy", R.movingReason || "", { title: R.moving }), "1 1 260px")];
      if (trim(d.fear)) {
        whyRow.push(el("button.btn.sm", { title: "Use the Fear line as the reason", onclick: function () {
          d.resolveWhy = trim(d.fear);
          EN.app.render();
        } }, "IT'S THEIR FEAR"));
      }
      kids.push(fieldRow(whyRow));
    }
    return el("div", { dataset: { block: "resolve" } }, kids);
  }

  function profileBlock() {
    var P = profiles(), d = _p.draft, row = d.profileN ? profileRow(d.profileN) : null, earned = earnedName(d.profile);
    var cur = row ? "n:" + row.n : earned ? "earned:" + earned : (_p.customProfile || trim(d.profile)) ? "custom" : "";
    var opts = [{ value: "", label: "Pick one, or roll" }, {
      group: (P.die || "d12") + ", or pick", items: (P.rows || []).map(function (r) { return { value: "n:" + r.n, label: r.n + ". " + r.name }; })
    }];
    var en = (P.earned && P.earned.names) || [];
    if (en.length) opts.push({ group: "Earned in play, never rolled", items: en.map(function (n) { return { value: "earned:" + n, label: n }; }) });
    opts.push({ value: "custom", label: "Written in play..." });
    var kids = [];
    var line = [
      field(lineOf("profile").line, selectEl("profile", opts, cur, function (v) {
        _p.customProfile = false;
        if (!v) { d.profile = ""; d.profileN = null; return; }
        if (v === "custom") { _p.customProfile = true; d.profileN = null; return; }
        if (v.indexOf("n:") === 0) {
          var r = profileRow(Number(v.slice(2)));
          if (r) { d.profile = r.name; d.profileN = r.n; }
          return;
        }
        d.profile = v.slice(7);
        d.profileN = null;
      }), "2 1 220px"),
      el("button.btn.sm", { title: "Roll a d12 on Their Profile of You", dataset: { act: "roll-profile" }, onclick: function () {
        var n = die(P.sides || 12), r = profileRow(n);
        if (!r) return;
        d.profile = r.name;
        d.profileN = r.n;
        _p.customProfile = false;
        toast("Rolled " + n + ": " + r.name + ".");
        EN.app.render();
      } }, "ROLL " + String(P.die || "d12").toUpperCase())
    ];
    var pc = EN.ui.ruleChip("gmp-profiles", { title: P.title || "Their Profile of You" });
    if (pc) line.push(el("div", { dataset: { people: "profile-rule" }, style: { alignSelf: "center" } }, [pc]));
    if (row) {
      line.push(el("span", { title: P.die + ": " + row.n, style: { display: "inline-flex", alignItems: "center" },
        html: EN.ui.dieFaceSvg(12, { size: 30, value: row.n, edge: "var(--accent)", num: "var(--accent)" }) }));
    }
    kids.push(fieldRow(line));
    if (cur === "custom") {
      kids.push(fieldRow([field("The Profile", input("profile", "A Profile the fiction gave them", {
        after: function (v) { var r = null; (P.rows || []).forEach(function (x) { if (x.name.toLowerCase() === trim(v).toLowerCase()) r = x; }); d.profileN = r ? r.n : null; }
      }), "1 1 100%")]));
    }
    if (row) kids.push(el("p.help", { style: { margin: "5px 0 0", color: "var(--text2)" }, text: "What they've heard: " + row.heard }));
    // "The PHB's other examples" are Profiles & Debt's Profile Examples (so-profiles/profile-examples)
    else if (earned && P.earned) kids.push(EN.ui.ruleText(el("p.help", { dataset: { people: "earned-text" }, style: { margin: "5px 0 0" } }), P.earned.text,
      { terms: { "The PHB's other examples": "so-profiles/profile-examples" } }));
    return el("div", { dataset: { block: "profile" } }, kids);
  }

  function weakBlock() {
    var R = book().resolveByRole || {}, d = _p.draft, A = approaches();
    var S = EN.gmBook && EN.gmBook.scenes && EN.gmBook.scenes.sitdown && EN.gmBook.scenes.sitdown.weakSpots;
    function sel(kind) {
      var opts = [{ value: "", label: "No weak spot" }].concat(A.map(function (a) { return { value: a.key, label: a.name }; }));
      return selectEl("weak." + kind, opts, d.weak[kind] || "", function (v) { d.weak[kind] = approachName(v) ? v : ""; });
    }
    var kids = [fieldHead("WEAK SPOTS")];
    kids.push(EN.ui.ruleText(el("p.help", { style: { margin: "0 0 2px" } }), (R.weakSpots && R.weakSpots.text) || ""));
    kids.push(fieldRow([
      field("Takes double Pressure from", sel("double"), "1 1 170px"),
      field("Why", input("weak.doubleWhy", (S && S.reason) || "The reason, in a few words"), "2 1 220px")
    ]));
    kids.push(fieldRow([
      field("Takes no Pressure from", sel("none"), "1 1 170px"),
      field("Why", input("weak.noneWhy", (S && S.reason) || "The reason, in a few words"), "2 1 220px")
    ]));
    if (d.weak.double && d.weak.double === d.weak.none) {
      kids.push(el("p.help", { style: { margin: "5px 0 0", color: "var(--warn)" },
        text: approachName(d.weak.double) + " is on both lines. The book's weak spots are double from one Approach and none from another." }));
    }
    if (S && S.insight && S.insight.text) kids.push(el("p.help", { style: { margin: "5px 0 0", color: "var(--text3)" }, text: S.insight.text }));
    return el("div", { dataset: { block: "weak" } }, kids);
  }

  // the card's parts that follow the typing, each built from the draft as it stands
  function cardSub(d) { return (trim(d.name) || "NEW CARD").toUpperCase(); }
  function cardHead() {
    var d = _p.draft, st = cardState(d), out = [];
    out.push(el("span", { dataset: { cardstate: st.key } }, [tag(st.label, st.key === "full" ? "var(--success)" : st.key === "walkon" ? "var(--accent)" : "var(--text3)")]));
    if (d.example) out.push(tag("THE BOOK'S EXAMPLE", "var(--gold)"));
    var dirty = isDirty(d);
    out.push(el("span", { dataset: { saved: dirty ? (d.id ? "changed" : "new") : "saved" } }, [
      dirty ? tag(d.id ? "UNSAVED CHANGES" : "NOT SAVED", "var(--warn)") : tag("IN CONTACTS", "var(--success)")]));
    return out;
  }
  function guarded(key, label, armedTitle, fn, dirty) {
    return dirty
      ? EN.ui.armButton(key, { label: label, armedLabel: "DISCARD THE CARD?", cls: ".btn.sm", armedTitle: armedTitle, onConfirm: fn })
      : el("button.btn.sm", { onclick: fn }, label);
  }
  function loadExample() {
    var E = book().example, d = blankDraft();
    if (!E) return;
    ["name", "print", "work", "want", "fear", "tell", "profile"].forEach(function (k) { d[k] = str(E[k]); });
    if (tierOf(E.resolveTier)) { d.resolveTier = E.resolveTier; d.resolveValue = E.resolveValue; }
    d.profileN = profileRow(E.profileN) ? E.profileN : null;
    d.example = E.key || "example";
    setDraft(d);
    toast("The book's example is on the card. Save it to keep it.");
    EN.app.render();
  }
  function cardActs() {
    var d = _p.draft, dirty = isDirty(d), any = hasContent(d);
    var fresh = function () { setDraft(blankDraft()); EN.app.render(); };
    return [
      el("button.btn.sm.primary", { disabled: !any || (!!d.id && !dirty), dataset: { act: "save" },
        onclick: function () { save(_p.draft); EN.app.render(); } }, d.id ? (dirty ? "SAVE CHANGES" : "SAVED") : "SAVE TO CONTACTS"),
      el("button.btn.sm", { disabled: !any, dataset: { act: "copy" },
        onclick: function () { copyText(cardText(_p.draft), "The card"); } }, "COPY THE CARD"),
      guarded("gmpeople:new", "NEW CARD", "The card has unsaved changes. Click again to clear it.", fresh, dirty),
      guarded("gmpeople:example", "LOAD THE BOOK'S EXAMPLE",
        "The card has unsaved changes. Click again to put the book's example over them.", loadExample, dirty)
    ];
  }
  function textBox(kind, text) {
    return el("div", { dataset: { copy: kind },
      style: { whiteSpace: "pre-wrap", fontSize: "12.5px", lineHeight: "1.45", background: "var(--bg1)",
               border: "1px solid var(--border)", borderRadius: "3px", padding: "8px 10px", maxHeight: "220px",
               overflowY: "auto", color: "var(--text2)", userSelect: "text", marginTop: "8px" }, text: text });
  }

  function fromThreatRow() {
    var src = threatSources(), d = _p.draft, dirty = isDirty(d), B = book();
    if (!src.length) return null;
    var groups = ["Bestiary", "Saved threats"].map(function (g) {
      var items = src.filter(function (s) { return s.group === g; }).map(function (s) { return { value: s.key, label: s.label }; });
      return items.length ? { group: g, items: items } : null;
    }).filter(Boolean);
    var cur = src.some(function (s) { return s.key === _p.fromThreat; }) ? _p.fromThreat : "";
    var make = function () {
      var s = src.filter(function (x) { return x.key === _p.fromThreat; })[0];
      if (!s) return;
      setDraft(draftFromThreat(s));
      toast(s.name + " is on a new card, Resolve carried across.");
      EN.app.render();
    };
    return el("div", { dataset: { block: "from-threat" } }, [
      fieldHead("A THREAT THE CREW TALKED DOWN"),
      el("p.help", { style: { margin: "0 0 2px" }, text: (B.card && B.card.fromThreat) || "" }),
      fieldRow([
        field("Threat", selectEl("fromThreat", [{ value: "", label: "Pick a threat with a Resolve line..." }].concat(groups), cur,
          function (v) { _p.fromThreat = v; }), "2 1 260px"),
        cur ? guarded("gmpeople:fromthreat", "START A CARD", "The card has unsaved changes. Click again to start the threat's card over them.", make, dirty)
            : el("button.btn.sm", { disabled: true, title: "Pick a threat first" }, "START A CARD")
      ])
    ]);
  }

  function promoteKids() {
    var d = _p.draft, T = EN.threats || {}, crew = crewNow(), g = promoteGrade(), kids = [];
    var C = book().card || {};
    kids.push(el("p.help", { style: { margin: "0 0 2px" }, text: C.promote || "" }));
    var tp = promoteTemplate(d);
    var tplCur = _p.promote.template ? _p.promote.template : (tp ? tp.species : "none");
    kids.push(fieldRow([
      field("Grade", selectEl("promote.grade", (T.grades || []).map(function (x) {
        return { value: String(x.g), label: "G" + x.g + (_p.promote.grade == null && x.g === g ? " (crew Caliber)" : "") };
      }), String(g), function (v) { _p.promote.grade = Number(v); }), "0 1 150px"),
      field("Designation", selectEl("promote.designation", (T.designations || []).map(function (x) { return { value: x.key, label: x.name }; }),
        _p.promote.designation, function (v) { _p.promote.designation = v; }), "0 1 140px"),
      field("Role", selectEl("promote.role", (T.roles || []).map(function (x) { return { value: x.key, label: x.name }; }),
        _p.promote.role, function (v) { _p.promote.role = v; }), "0 1 140px"),
      field("Type", selectEl("promote.type", threatTypes().map(function (x) { return { value: x, label: x }; }),
        promoteType(d), function (v) { _p.promote.type = v; }), "0 1 140px"),
      field("Species Template", selectEl("promote.template", [{ value: "none", label: "None" }].concat(templates().map(function (x) {
        return { value: x.species, label: x.species };
      })), tplCur, function (v) { _p.promote.template = v; }), "0 1 150px")
    ]));
    var x = buildFor(d);
    if (!x) {
      kids.push(el("p.help", { dataset: { live: "promote-preview" }, style: { margin: "6px 0 0", color: "var(--text3)" },
        text: "Give the contact a name, and it can step into initiative." }));
    } else {
      var b = x.block, bits = ["DEF " + b.defense, b.vitality + " Vitality", "DC " + b.saveDC, b.xp + " XP"];
      kids.push(el("p.help", { dataset: { live: "promote-preview" }, style: { margin: "6px 0 0", color: "var(--accent)" },
        text: b.name + ": G" + b.grade + " " + b.designationName + (b.roleName ? " " + b.roleName : "") + ", " + promoteType(d) + ". " +
              bits.join(" · ") + ". " + (b.resolve ? "Resolve " + b.resolve + "." : "No Resolve on the card, so the threat carries none.") }));
      if (b.species && tp) {
        kids.push(el("p.help", { style: { margin: "3px 0 0", color: "var(--text2)" },
          text: "The " + b.species + " template adds " + (tp.traits || []).map(function (a) { return a.name; }).join(" and ") + "." }));
      }
      if (_p.promote.grade == null && crew.source === "none") {
        kids.push(el("p.help", { style: { margin: "3px 0 0" }, text: "No crew found, so the Grade starts at 1. Pick the Grade the fight runs at." }));
      }
    }
    kids.push(el("div.row.wrap", { style: { gap: "8px", marginTop: "8px" } }, [
      el("button.btn.sm.primary", { disabled: !x, dataset: { act: "promote-threat" }, title: "Save this build under the Threats tab's Saved Threats",
        onclick: promoteToThreats }, "SAVE AS A THREAT"),
      el("button.btn.sm", { disabled: !x, dataset: { act: "promote-plan" }, title: "Hand this build to the Encounters tab as a line on the plan",
        onclick: promoteToPlan }, "+ ENCOUNTER PLAN")
    ]));
    return kids;
  }

  function cardPanel() {
    var B = book(), C = B.card || {}, d = _p.draft, kids = [];
    kids.push(el("p.help", { style: { margin: 0 }, text: C.intro || "" }));
    if (d.fromThreat) {
      kids.push(el("p.help", { style: { margin: "4px 0 0", color: "var(--text2)" }, text: "Picked up from a threat the crew talked down: " + d.fromThreat + "." }));
    }

    kids.push(fieldHead("THE FIRST THREE: ALL A WALK-ON NEEDS", "var(--accent)"));
    var N = lineOf("name");
    kids.push(fieldRow([
      field(N.line, input("name", "What people call them", { title: N.holds }), "2 1 220px"),
      field("#PRINT, if different", input("print", "What their #PRINT says"), "2 1 220px")
    ]));
    var outs = nameTable("outsiders");
    var noteRow = [
      field("Street handle", input("handle", "What gets said on a channel"), "1 1 180px"),
      field("Species", speciesSelect(), "1 1 160px")
    ];
    kids.push(fieldRow(noteRow));
    if (d.species === "outsiders" || trim(d.nameNote)) {
      kids.push(fieldRow([field((outs && outs.columns && outs.columns[1]) || "Where It Came From",
        input("nameNote", "The first word anyone said to them, the landlady, a line on a form"), "1 1 100%")]));
    }
    kids.push(lineField("work"));
    kids.push(lineField("want"));

    kids.push(fieldHead("THE SECOND TIME THEY MATTER"));
    kids.push(lineField("fear"));
    kids.push(resolveBlock());
    kids.push(profileBlock());
    kids.push(lineField("tell", true));
    kids.push(weakBlock());
    kids.push(fieldHead("NOTES"));
    kids.push(input("notes", "Anything else the next GM, or next month's you, should know.", { area: true }));

    var acts = el("div.row.wrap", { dataset: { live: "card-acts" }, style: { gap: "8px", marginTop: "12px", alignItems: "center" } }, cardActs());
    kids.push(acts);
    var box = textBox("card", cardText(d));
    kids.push(box);

    kids.push(fromThreatRow());

    kids.push(fieldHead("PROMOTE TO THREAT", "var(--danger)"));
    var promote = el("div", { dataset: { block: "promote" } }, promoteKids());
    kids.push(promote);

    var head = el("span", { dataset: { live: "card-head" }, style: { display: "inline-flex", gap: "6px", alignItems: "center", flexWrap: "wrap" } }, cardHead());
    var p = EN.ui.panel(C.title || "The Contact Card", cardSub(d), kids.filter(Boolean), { headerRight: [head] });
    p.dataset.people = "card";
    // three state chips beside the title: on a phone they drop under it instead of squeezing it onto three lines
    var ph = p.querySelector(".panel-h");
    if (ph) ph.style.flexWrap = "wrap";
    if (_paint) {
      _paint.acts = acts;
      _paint.head = head;
      _paint.copyBox = box;
      _paint.promote = promote;
      _paint.cardTag = p.querySelector(".panel-h .tag");
    }
    return p;
  }

  /* ---- the roller panel ---------------------------------------------------------- */
  function useKids() {
    var d = _p.draft, n = trim(d.name);
    return [el("p.help", { style: { margin: 0 },
      text: "USE puts a name on the card in the editor" + (n ? ", now " + n + "." : hasContent(d) ? ", which has no name yet." : ", a new card.") })];
  }
  function resultRow(r, i) {
    var main, rest = "";
    if (r.combine === "joined") main = r.a + " " + r.b;
    else if (r.combine === "apart") { main = r.a; rest = "trusted name " + r.b; }
    else if (r.combine === "explained") { main = r.a; rest = r.b; }
    else main = r.a;
    return el("div.row.between.wrap", { dataset: { roll: String(i), table: r.table, n: String(r.n) },
      style: { gap: "8px", alignItems: "center", padding: "6px 0", borderBottom: "1px solid var(--border)" } }, [
      el("div.row", { style: { gap: "10px", alignItems: "center", flex: "1 1 200px", minWidth: "0" } }, [
        EN.ui.d20Face(r.n, { size: 28, kept: true }),
        el("div", { style: { minWidth: "0" } }, [
          el("span", { style: { fontWeight: 600 }, text: main }),
          rest ? el("span.help", { style: { margin: "0 0 0 6px" }, text: rest }) : null,
          el("div.mono", { style: { fontSize: "9.5px", letterSpacing: ".12em", color: "var(--text3)" }, text: tableName(r.table).toUpperCase() })
        ])
      ]),
      el("div.row", { style: { gap: "6px" } }, [
        el("button.btn.sm", { onclick: function () { copyText(resultText(r), resultText(r)); } }, "COPY"),
        el("button.btn.sm.primary", { title: "Put it on the card in the editor", onclick: function () { useResult(r); } }, "USE")
      ])
    ]);
  }
  function tableList(key) {
    var rows, cols, out = [];
    if (key === "handles") {
      var H = handles();
      rows = (H && H.rows) || [];
      cols = [String(H ? H.die : "d20").toUpperCase(), "Handle"];
    } else {
      var T = nameTable(key);
      rows = (T && T.rows) || [];
      cols = [String(names().die || "d20").toUpperCase()].concat((T && T.columns) || []);
    }
    var trs = rows.map(function (row) {
      var r = resultOf(key, row.n);
      var cells = [el("td", { style: { color: "var(--text3)", whiteSpace: "nowrap" }, text: String(row.n) })];
      if (key === "handles") cells.push(el("td", { style: { color: "var(--text)" }, text: row.text }));
      else { cells.push(el("td", { style: { color: "var(--text)" }, text: row.a })); cells.push(el("td", { text: row.b })); }
      cells.push(el("td", { style: { textAlign: "right" } }, [
        el("button.btn.sm", { style: { padding: "0 8px" }, onclick: function () { if (r) useResult(r); } }, "USE")
      ]));
      return el("tr", { dataset: { row: String(row.n) } }, cells);
    });
    out.push(el("table.sktable", { dataset: { list: key }, style: { width: "100%", fontSize: "12px", marginTop: "6px" } }, [
      el("thead", null, [el("tr", null, cols.concat([""]).map(function (h) { return el("th", { style: { textAlign: "left" }, text: h }); }))]),
      el("tbody", null, trs)
    ]));
    return out;
  }
  function rollerPanel() {
    var N = names(), H = handles(), R = _p.roll, kids = [];
    (N.intro || []).forEach(function (t) { kids.push(el("p.help", { style: { margin: "0 0 6px", color: "var(--text2)" }, text: t })); });
    var opts = (N.tables || []).map(function (t) { return { key: t.key, label: t.name }; });
    if (H) opts.push({ key: "handles", label: H.title });
    if (!opts.some(function (o) { return o.key === R.table; }) && opts.length) R.table = opts[0].key;
    kids.push(el("div.row.wrap", { style: { gap: "6px", margin: "4px 0 8px" } }, opts.map(function (o) {
      return el("span.chip" + (R.table === o.key ? ".on" : ""), { dataset: { table: o.key },
        style: { cursor: "pointer", fontSize: "10.5px", borderStyle: o.key === "handles" ? "dashed" : null },
        onclick: function () { R.table = o.key; EN.app.render(); } }, o.label);
    })));
    var T = R.table === "handles" ? H : nameTable(R.table);
    if (T && T.intro) kids.push(el("p.help", { style: { margin: "0 0 6px" }, text: T.intro }));
    if (T && T.combine === "apart") {
      kids.push(el("p.help", { style: { margin: "0 0 6px", color: "var(--text3)" },
        text: "One roll gives both names. USE files the formal name as the card's name and the trusted name as its street handle." }));
    } else if (T && T.combine === "explained") {
      kids.push(el("p.help", { style: { margin: "0 0 6px", color: "var(--text3)" },
        text: "One roll gives the name and where it came from, and the two stay together on the card." }));
    }
    var count = Number(R.count) || 1;
    kids.push(el("div.row.wrap", { style: { gap: "8px", alignItems: "flex-end" } }, [
      field("How many", el("select", { dataset: { pf: "roll.count" }, style: { width: "auto" },
        onchange: function (e) { R.count = Number(e.target.value) || 1; EN.app.render(); } },
        COUNTS.map(function (c) { return el("option", { value: String(c), selected: c === count }, String(c)); })), "0 0 90px"),
      el("button.btn.sm.primary", { dataset: { act: "roll-names" }, onclick: rollBatch },
        "ROLL " + (count > 1 ? count + " x " : "") + "D20"),
      R.results.length ? el("button.btn.sm", { onclick: function () {
        copyText(R.results.map(resultText).join("\n"), R.results.length === 1 ? "The name" : "The names");
      } }, "COPY ALL") : null
    ]));
    var use = el("div", { dataset: { live: "use-line" }, style: { margin: "8px 0 2px" } }, useKids());
    if (_paint) _paint.use = use;
    kids.push(use);
    var res = el("div", { dataset: { live: "roll-results" } }, R.results.map(resultRow));
    if (!R.results.length) res.appendChild(el("p.help", { style: { margin: "4px 0 0", color: "var(--text4)" }, text: "Nothing rolled yet." }));
    kids.push(res);
    kids.push(el("button.btn.sm.ghost", { style: { marginTop: "8px" }, dataset: { act: "show-table" },
      onclick: function () { R.showTable = !R.showTable; EN.app.render(); } },
      (R.showTable ? "▾  HIDE THE TABLE" : "▸  READ DOWN THE TABLE")));
    if (R.showTable) kids.push(el("div", { style: { overflowX: "auto" } }, tableList(R.table)));
    var p = EN.ui.panel(N.title || "Names", "D20 · ROLL OR PICK", kids);
    p.dataset.people = "names";
    return p;
  }

  /* ---- the contacts library -------------------------------------------------------- */
  function searchText(d) {
    var bits = TEXT.map(function (k) { return d[k]; }).concat([resolveLine(d), speciesName(d.species), weakText(d)]);
    return bits.filter(Boolean).join(" \n ").toLowerCase();
  }
  function contactCard(r) {
    var d = draftOf(r), ed = _p.draft, onCard = !!ed.id && r.id === ed.id, dirty = isDirty(ed), st = cardState(d);
    var tags = [tag(st.label, st.key === "full" ? "var(--success)" : st.key === "walkon" ? "var(--accent)" : "var(--text3)")];
    if (resolveShort(d)) tags.push(tag("RESOLVE " + resolveShort(d).toUpperCase(), "var(--gold)"));
    if (trim(d.profile)) tags.push(tag(trim(d.profile).toUpperCase(), "var(--text2)"));
    if (d.species) tags.push(tag(speciesName(d.species).toUpperCase()));
    if (onCard) tags.push(tag("ON THE CARD", "var(--accent)"));
    var lines = [];
    ["work", "want", "fear", "tell"].forEach(function (k) {
      if (trim(d[k])) lines.push(el("p.help", { style: { margin: "3px 0 0" } }, [
        el("span", { style: { color: "var(--text3)" }, text: lineOf(k).line + ": " }), document.createTextNode(trim(d[k]))]));
    });
    if (movedText(d)) lines.push(el("p.help", { style: { margin: "3px 0 0" }, text: movedText(d) }));
    if (resolveShort(d) && trim(d.resolveNote)) {
      lines.push(el("p.help", { style: { margin: "3px 0 0" } }, [
        el("span", { style: { color: "var(--text3)" }, text: lineOf("resolve").line + ": " }), document.createTextNode(resolveLine(d))]));
    }
    if (weakText(d)) lines.push(el("p.help", { style: { margin: "3px 0 0" }, text: "Weak spots: " + weakText(d) }));
    if (trim(d.notes)) lines.push(el("p.help", { style: { margin: "3px 0 0", color: "var(--text2)" }, text: "Notes: " + trim(d.notes) }));
    var open = (dirty && !onCard)
      ? EN.ui.armButton("gmpeople:open:" + r.id, { label: "OPEN", armedLabel: "DISCARD THE CARD?", cls: ".btn.sm",
          armedTitle: "The card in the editor has unsaved changes. Click again to open this contact over them.",
          onConfirm: function () { openContact(r.id); EN.app.render(); } })
      : el("button.btn.sm", { disabled: onCard, onclick: function () { openContact(r.id); EN.app.render(); } }, onCard ? "ON THE CARD" : "OPEN");
    return el("div.feature", { dataset: { contact: r.id },
      style: { flex: "1 1 300px", minWidth: "0", margin: 0, borderLeftColor: onCard ? "var(--accent)" : "var(--border2)" } }, [
      el("div", { style: { fontWeight: 600 }, text: nameLine(d) }),
      trim(d.handle) ? el("p.help", { style: { margin: "2px 0 0", color: "var(--text2)" }, text: "Handle: " + trim(d.handle) }) : null,
      trim(d.nameNote) ? el("p.help", { style: { margin: "2px 0 0" }, text: "Where the name came from: " + trim(d.nameNote) }) : null,
      el("div.row.wrap", { style: { gap: "5px", margin: "5px 0 2px" } }, tags),
      el("div", null, lines),
      el("div.row.wrap", { style: { gap: "6px", marginTop: "8px" } }, [
        open,
        el("button.btn.sm", { onclick: function () { copyText(cardText(d), trim(d.name) || "The card"); } }, "COPY"),
        EN.ui.armButton("gmpeople:del:" + r.id, { label: "DELETE", armedLabel: "DELETE?",
          armedTitle: "Removes this contact. A threat promoted from it stays where it is.",
          onConfirm: function () {
            var wasOpen = _p.draft.id === r.id, keep = wasOpen && isDirty(_p.draft);
            gm.drop(BAG, r.id);
            // the open card goes with it, unless it holds changes not yet saved
            if (wasOpen && !keep) setDraft(blankDraft());
            toast((trim(d.name) || "The contact") + " deleted." + (keep ? " Its unsaved card is still in the editor." : ""));
            EN.app.render();
          } })
      ])
    ]);
  }
  function listInto(host) {
    var all = gm.list(BAG), q = trim(_p.q).toLowerCase();
    var rows = q ? all.filter(function (r) { return searchText(draftOf(r)).indexOf(q) !== -1; }) : all;
    if (q) {
      host.appendChild(el("div.row.between.wrap", { style: { gap: "8px", alignItems: "center", marginBottom: "6px" } }, [
        el("p.help", { style: { margin: 0 }, text: rows.length ? rows.length + " of " + all.length + " match." : "Nothing matches." }),
        el("button.btn.sm.ghost", { onclick: function () { _p.q = ""; EN.app.render(); } }, "CLEAR SEARCH")
      ]));
    }
    host.appendChild(el("div.row.wrap", { style: { gap: "10px", alignItems: "stretch" } }, rows.map(contactCard)));
  }
  function libraryPanel() {
    var all = gm.list(BAG), kids = [];
    if (!all.length) {
      kids.push(el("div.muted-box", { style: { padding: "18px" },
        text: "No contacts yet. Write a card above and save it, or load the book's example." }));
    } else {
      kids.push(el("input", { type: "text", value: _p.q, dataset: { pf: "search" },
        placeholder: "search names, work, wants, fears, tells and notes",
        style: { width: "100%", marginBottom: "10px" },
        oninput: function (e) {
          _p.q = e.target.value;
          // a local re-render, because a full one would steal focus mid-word
          var host = e.target.parentNode.querySelector("[data-live='contacts']");
          if (host) { EN.ui.clear(host); listInto(host); }
        } }));
      var host = el("div", { dataset: { live: "contacts" } });
      listInto(host);
      kids.push(host);
    }
    var p = EN.ui.panel("Contacts", all.length + (all.length === 1 ? " CONTACT" : " CONTACTS"), kids);
    p.dataset.people = "contacts";
    return p;
  }

  /* ---- the book, for reference -------------------------------------------------------
     The NPC Quick-Build chapter is in the Codex (js/codex_gm_play.js): the
     Contact Card and the book's example (gmp-quickbuild), Resolve by Role
     (gmp-resolve, which the Scenes tab's Sit-Down links to as well) and Their
     Profile of You (gmp-profiles). This panel points there; through EN.ui
     each link is plain text when codex.js is missing. */
  function referencePanel() {
    var B = book(), C = B.card || {}, R = B.resolveByRole || {}, P = B.profiles || {};
    var list = [["gmp-quickbuild/the-contact-card", C.title || "The Contact Card"], ["gmp-quickbuild/the-book-s-example", "The Book's Example"],
                ["gmp-resolve", R.title || "Resolve by Role"], ["gmp-profiles", P.title || "Their Profile of You"]];
    var line = el("p.help", { dataset: { people: "codex" }, style: { margin: 0 } }, [document.createTextNode("In the Codex: ")]);
    list.forEach(function (it, i) {
      if (i) line.appendChild(document.createTextNode(" · "));
      line.appendChild(EN.ui.ruleLink(it[0], it[1]));
    });
    var p = EN.ui.panel("From the Book", String(B.title || "NPC Quick-Build").toUpperCase(), [line]);
    p.dataset.people = "reference";
    return p;
  }

  /* ---- live paint -------------------------------------------------------------------- */
  /* What each live part is drawn from, as a string. A part is rebuilt only when
     its string changes, so typing inside an already unsaved card swaps no
     button at all: only the keystroke that flips a state rebuilds what that
     state draws. */
  function liveSig() {
    var d = _p.draft, dirty = isDirty(d);
    return {
      head: JSON.stringify([dirty, !!d.id, cardState(d).label, d.example || ""]),
      acts: JSON.stringify([dirty, hasContent(d), !!d.id]),
      promote: JSON.stringify([trim(d.name), trim(d.work), resolveLine(d), d.id || 0]),
      use: JSON.stringify([trim(d.name), hasContent(d)]),
      lib: JSON.stringify([dirty, d.id || 0, gm.list(BAG).length])
    };
  }
  /* Called on every keystroke in the card's text fields (F19). Nothing the GM
     is typing into is rebuilt, so focus and the caret stay put, and a button
     pressed right after typing is the same node the click lands on. */
  function paintLive() {
    if (!_paint) return;
    var d = _p.draft;
    if (_paint.copyBox && _paint.copyBox.isConnected) _paint.copyBox.textContent = cardText(d);
    if (_paint.resolveLine && _paint.resolveLine.isConnected) _paint.resolveLine.textContent = resolveSays(d);
    if (_paint.cardTag && _paint.cardTag.isConnected) _paint.cardTag.textContent = cardSub(d);
    var s = liveSig(), was = _paint.sig || {};
    if (s.head !== was.head) refill(_paint.head, cardHead());
    if (s.acts !== was.acts) refill(_paint.acts, cardActs());
    if (s.promote !== was.promote) refill(_paint.promote, promoteKids());
    if (s.use !== was.use) refill(_paint.use, useKids());
    // the list's OPEN buttons ask first while the card is unsaved, so the list follows too
    if (s.lib !== was.lib && _paint.lib && _paint.lib.isConnected && _paint.lib.parentNode) {
      var fresh = libraryPanel();
      _paint.lib.parentNode.replaceChild(fresh, _paint.lib);
      _paint.lib = fresh;
    }
    _paint.sig = s;
  }

  /* ---- the tab ------------------------------------------------------------------------ */
  function render(mount) {
    EN.ui.clear(mount);
    _crew = null;
    _paint = {};
    var B = book();
    if (!B) {
      mount.appendChild(el("div", null, [heading("People", "// contacts and names"), undoStrip(),
        el("div.muted-box", { text: "People data did not load. Check app/data/gm_people.js." })].filter(Boolean)));
      return;
    }
    var h = (EN.gmView && typeof EN.gmView.takeHandoff === "function") ? EN.gmView.takeHandoff("people") : null;
    if (h && typeof h.contactId === "string" && gm.rec(BAG, h.contactId) && _p.draft.id !== h.contactId) {
      if (isDirty(_p.draft)) toast("The card in the editor has unsaved changes, so it stays open.");
      else openContact(h.contactId);
    }
    syncDraft();
    var NI = B.notInInitiative || {};
    var intro = el("div", { style: { margin: "-6px 0 14px", maxWidth: "860px" } }, (NI.paragraphs || []).map(function (t, i) {
      return el("p.help", { style: { margin: "0 0 6px", color: i ? "var(--text3)" : "var(--text2)" }, text: t });
    }));
    var lib = libraryPanel();
    _paint.lib = lib;
    mount.appendChild(el("div", null, [
      heading("People", "// contacts and names"),
      undoStrip(),
      intro,
      el("div.row.wrap", { style: { gap: "12px", alignItems: "flex-start" } }, [
        el("div", { style: { flex: "3 1 520px", minWidth: "0" } }, [cardPanel()]),
        el("div", { style: { flex: "2 1 340px", minWidth: "0" } }, [rollerPanel()])
      ]),
      gap(),
      lib,
      gap(),
      referencePanel()
    ].filter(Boolean)));
    _paint.sig = liveSig();
  }

  return { render: render };
})();
