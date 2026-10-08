/* ===========================================================================
   ELYSIUM NIGHTS · GM Job Board (Admin tab)
   Rolls a job off the book's five tables and the Twelve Postings, lays it on a
   card that keeps what the crew is told apart from what only the GM knows,
   hands it out (COPY, or a #POST filed in the crew's records), and keeps the
   job log. Every word of the tables is EN.gmBook.jobs (data/gm_jobs.js): this
   file decides WHICH row, never what a row says.

   Rulings this file carries (author, 2026-10; the book is silent on them):
     - Each column is rolled, picked from a select, or locked. ROLL ALL skips
       the locked ones, and a locked column takes no roll and no pick.
     - Job 12, the double bill, rolls the Job table twice more, and a 12 that
       comes up inside it is rolled again rather than nesting a third job. The
       first is the job the client told the crew about (`picks.job`); the
       second is the part the client did not mention (`picks.job2`), and only
       the GM ever sees it.
     - Opposition 06 pulls a cryptid from the Bestiary at the job's Grade, or
       at the nearest Grade that has one. The job's Grade is the site's Grade
       and defaults to the crew's Caliber (EN.gmEngine.crew, ruling D4).
     - Opposition 10 marks the complication as the real threat.
     - Complication 10 is kept even with no cryptid in the job; the GM adapts.
     - The Twelve Postings are a list and a d12. A posting seeds the hook.
     - What leaves the GM side (COPY FOR THE CREW, SEND TO #POST) carries the
       client, the job, the site and the GM's hook, and nothing else. The
       opposition, the complication and the unmentioned half of a double bill
       never leave this screen except in the GM's own copy.

   A job record (bag `jobs`, the shared shape every GM module reads):
     { id, title, grade, picks: {client, job, job2, site, opposition,
       complication}, postingId, hook, gmNotes, status, sentTo: [charId],
       encounterId, paydayId, sends }
   Each pick is {n, text} as the row printed it, plus `name` on a Job row and
   `cryptid` (a Bestiary name) on Opposition 06. A saved job is a snapshot: it
   keeps the text it was saved with. `sends` is this file's own bookkeeping,
   one entry per SEND TO #POST still standing:
     { at, writes: [{id, charId}], added: [charId], setPosted, prevStatus }
   so a withdrawn posting takes its names back out of sentTo and its status
   back to what it was, however it was withdrawn.

   Writes to a Freelancer's record (a posting) go through EN.gmStore.writeCrew
   and nowhere else, behind an armed confirm, with an UNDO (ruling D1). Each
   write is tagged {source: "posting", jobId} in the ledger, and UNDO POSTING
   is worked out from the ledger on every render, never from memory, so it
   survives a reload and a trip to another job (F4, F15).
   =========================================================================== */
window.EN = window.EN || {};

EN.gmJobs = (function () {
  var el = EN.ui.el, toast = EN.ui.toast, gm = EN.gmStore;

  var STATUSES = [
    { k: "draft",  label: "Draft",  color: "var(--text3)" },
    { k: "posted", label: "Posted", color: "var(--accent)" },
    { k: "taken",  label: "Taken",  color: "var(--gold)" },
    { k: "done",   label: "Done",   color: "var(--success)" },
    { k: "paid",   label: "Paid",   color: "var(--flow)" }
  ];
  var PICK_KEYS = ["client", "job", "job2", "site", "opposition", "complication"];
  // the columns the crew is told about; the other two are the GM's alone
  var CREW_COLS = { client: true, job: true, site: true };
  // what each kind of row instruction is called on its chip (app labels, not book text)
  var INSTR = { beats: "THREE BEATS", reference: "SEE THE RULES", sitdown: "SIT-DOWN",
                rolltwice: "ROLL TWICE", pullcryptid: "PULL A CRYPTID", complication: "SEE THE COMPLICATION" };
  var DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  function blankDraft() {
    return { id: null, title: "", grade: null,
             picks: { client: null, job: null, job2: null, site: null, opposition: null, complication: null },
             postingId: null, hook: "", gmNotes: "", status: "draft", sentTo: [],
             encounterId: null, paydayId: null };
  }

  /* Transient UI state, deliberately not persisted, like the Threats builder's:
     the card is a working surface and the job log is where a job is kept.
     Survives a tab switch, since this is still one module. `grade` null on the
     draft means "follow the crew's Caliber". `pick` holds the GM's recipient
     choices keyed by charId (null-prototype, the keys come from records);
     absent means the default, which is on. */
  var _j = {
    draft: blankDraft(),
    locks: Object.create(null),
    postN: null,          // the posting the d12 last landed on
    pick: Object.create(null),
    from: "JOB BOARD",
    when: "",             // blank follows the clock
    filter: "all"
  };
  var _crew = null;       // EN.gmEngine.crew(), read once per render
  /* What follows the GM's typing without a re-render (F19): the two text
     previews, the card's subtitle, header tags and buttons, the #POST buttons
     and the job log. A re-render on change used to swap out the button under
     the pointer, so the first click after typing never landed. */
  var _paint = null;

  /* ---- small helpers, local per the house convention ----------------------- */
  function own(o, k) { return !!o && Object.prototype.hasOwnProperty.call(o, k); }
  function copy(v) { return v == null ? v : JSON.parse(JSON.stringify(v)); }
  function pad2(n) { n = Number(n) || 0; return (n < 10 ? "0" : "") + n; }
  function die(sides) { return 1 + Math.floor(Math.random() * sides); }
  function lbl(t) { return el("label.fl", { text: t }); }
  function book() { return (EN.gmBook && EN.gmBook.jobs) || null; }
  function tableOf(key) {
    var B = book();
    return B ? (B.tables.filter(function (t) { return t.key === key; })[0] || null) : null;
  }
  function rowOf(key, n) {
    var T = tableOf(key);
    return T ? (T.rows.filter(function (r) { return r.n === n; })[0] || null) : null;
  }
  function postingOf(n) {
    var B = book();
    return (B && B.postings) ? (B.postings.rows.filter(function (r) { return r.n === n; })[0] || null) : null;
  }
  function pickOf(row) {
    if (!row) return null;
    var p = { n: row.n, text: row.text };
    if (row.name) p.name = row.name;
    return p;
  }
  function entryByName(name) {
    var B = EN.bestiary;
    return (B && B.entries) ? (B.entries.filter(function (e) { return e.name === name; })[0] || null) : null;
  }
  function statusOf(k) { return STATUSES.filter(function (s) { return s.k === k; })[0] || STATUSES[0]; }
  function fieldHead(t, color) {
    return el("div.mono", { style: { fontSize: "10px", letterSpacing: ".14em", color: color || "var(--text3)", margin: "10px 0 3px" }, text: t });
  }
  function tag(t, color) {
    return el("span.chip", { style: { fontSize: "9.5px", color: color || "var(--text3)", borderColor: color || "var(--border2)" }, text: t });
  }
  function fmtDay(ts) {
    if (!ts) return "";
    var t = new Date(ts);
    return t.getDate() + " " + MONTHS[t.getMonth()] + ", " + pad2(t.getHours()) + ":" + pad2(t.getMinutes());
  }
  function nowWhen() {
    var t = new Date();
    return pad2(t.getHours()) + ":" + pad2(t.getMinutes()) + ", " + DAYS[t.getDay()];
  }

  // the same heading every Admin tab draws for itself (see gm.js)
  function heading(title, sub) {
    return el("div.row.between.wrap", { style: { marginBottom: "14px" } }, [
      el("h1", { style: { fontSize: "22px", letterSpacing: ".06em" },
        html: title + ' <span class="dim3" style="font-size:13px">' + sub + "</span>" })
    ]);
  }

  /* ---- the crew and the Grade ---------------------------------------------
     The crew is ruling D4's: the Table's crew rows if any, else the filed
     roster. A job's Grade is the site's Grade, and until the GM picks one it
     follows the crew's Caliber. */
  function crewNow() {
    if (!_crew) {
      try { _crew = EN.gmEngine.crew(); }
      catch (e) { _crew = { members: [], headcount: 0, caliber: 1, source: "none" }; }
    }
    return _crew;
  }
  function gradeOf(d) {
    var g = Math.round(Number(d.grade));
    return (g >= 1 && g <= 5) ? g : crewNow().caliber;
  }

  /* ---- the Bestiary pull ----------------------------------------------------
     Every entry of a category at the given Grade, or at the nearest Grade that
     has any. Both neighbours count when they are equally near. */
  function nearest(category, grade) {
    var B = EN.bestiary;
    if (!B || !B.entries) return [];
    var pool = B.entries.filter(function (e) { return e.category === category && typeof e.grade === "number"; });
    var best = Infinity;
    pool.forEach(function (e) { var dd = Math.abs(e.grade - grade); if (dd < best) best = dd; });
    return pool.filter(function (e) { return Math.abs(e.grade - grade) === best; });
  }
  function instrOf(key, p) {
    var row = p ? rowOf(key, p.n) : null;
    return (row && row.instruction) || null;
  }
  function needsCryptid(d) {
    var ins = instrOf("opposition", d.picks.opposition);
    return !!(ins && ins.kind === "pullcryptid");
  }
  // `avoid` is the cryptid already pulled, so PULL AGAIN changes it when there is a choice
  function pullCryptid(d, avoid) {
    var cands = nearest("cryptids", gradeOf(d));
    if (avoid && cands.length > 1) cands = cands.filter(function (e) { return e.name !== avoid; });
    var e = cands.length ? cands[Math.floor(Math.random() * cands.length)] : null;
    if (d.picks.opposition) d.picks.opposition.cryptid = e ? e.name : null;
    return e;
  }
  function cryptidFits(d) {
    var cur = d.picks.opposition && d.picks.opposition.cryptid;
    return !!cur && nearest("cryptids", gradeOf(d)).some(function (e) { return e.name === cur; });
  }
  /* After a Grade change the pulled cryptid stays if it is still a right answer
     at the new Grade, and is pulled again if not. A locked opposition keeps its
     cryptid either way: the lock is the GM saying "this one". */
  function recheckCryptid(d) {
    if (!needsCryptid(d) || _j.locks.opposition) return;
    if (!cryptidFits(d)) pullCryptid(d);
  }
  function realThreat(d) {
    var ins = instrOf("opposition", d.picks.opposition);
    return !!(ins && ins.kind === "complication");
  }

  /* ---- rolling and picking ------------------------------------------------- */
  function isDouble(n) {
    var ins = instrOf("job", { n: n });
    return !!(ins && ins.kind === "rolltwice");
  }
  // the double bill's own row number, read off the data rather than assumed to be 12
  function doubleN() {
    var T = tableOf("job");
    var r = T ? T.rows.filter(function (x) { return isDouble(x.n); })[0] : null;
    return r ? r.n : 0;
  }
  /* The double bill. Its row says roll twice; a 12 inside it is rolled again
     (ruling), so the pair is always two real jobs. The guard only stops a data
     file whose every row says roll twice from spinning forever. */
  function doubleBill(d) {
    var T = tableOf("job");
    function once() {
      var n = die(T.sides), guard = 0;
      while (isDouble(n) && guard++ < 200) n = die(T.sides);
      return n;
    }
    d.picks.job = pickOf(rowOf("job", once()));
    d.picks.job2 = pickOf(rowOf("job", once()));
  }
  function setPick(d, key, n) {
    if (!n) {
      d.picks[key] = null;
      if (key === "job") d.picks.job2 = null;
      delete _j.locks[key];
      return;
    }
    if (key === "job") {
      if (isDouble(n)) { doubleBill(d); return; }
      d.picks.job = pickOf(rowOf("job", n));
      d.picks.job2 = null;
      return;
    }
    var row = rowOf(key, n);
    if (!row) return;
    d.picks[key] = pickOf(row);
    if (key === "opposition" && needsCryptid(d)) pullCryptid(d);
  }
  function rollColumn(d, key) {
    var T = tableOf(key);
    if (T) setPick(d, key, die(T.sides));
  }
  function rollAll() {
    var B = book(), d = _j.draft, rolled = 0, held = 0;
    B.order.forEach(function (k) {
      if (_j.locks[k]) { held++; return; }
      rollColumn(d, k);
      rolled++;
    });
    toast(held ? "Rolled " + rolled + ", kept " + held + " locked." : "Rolled all five tables.");
    EN.app.render();
  }

  /* ---- the job as text -----------------------------------------------------
     A row that tells the GM to do something prints that instruction at its end
     ("Run the room as a Sit-Down."). That sentence is the GM's, so it is cut
     from what the crew is handed; the GM's own copy keeps the whole row. */
  function crewText(key, p) {
    var t = String(p.text || "");
    var ins = instrOf(key, p);
    if (ins && ins.text) {
      var at = t.lastIndexOf(ins.text);
      if (at > 0 && at + ins.text.length === t.length) t = t.slice(0, at).replace(/\s+$/, "");
    }
    return t;
  }
  function jobLine(p, forCrew) { return (p.name ? p.name + ". " : "") + (forCrew ? crewText("job", p) : String(p.text || "")); }
  /* A title the GM did not type follows the job: the told job's name, else the
     seeding posting. It is stored on save, and a stored title that still equals
     that default reopens as "not typed", so it keeps following. */
  function autoTitle(d) {
    if (d.picks.job && d.picks.job.name) return d.picks.job.name;
    if (d.postingId) return "Posting " + pad2(d.postingId);
    return "Untitled job";
  }
  function titleOf(d) {
    var t = String(d.title || "").trim();
    return t || autoTitle(d);
  }
  function crewLines(d, forCrew) {
    var P = d.picks, out = [];
    if (P.client) out.push("Client: " + (forCrew ? crewText("client", P.client) : P.client.text));
    if (P.job) out.push("Job: " + jobLine(P.job, forCrew));
    if (P.site) out.push("Site: " + (forCrew ? crewText("site", P.site) : P.site.text));
    return out;
  }
  // the body a #POST carries and COPY FOR THE CREW copies: client, job, site, hook, and nothing else
  function crewBody(d) {
    var parts = [], L = crewLines(d, true), h = String(d.hook || "").trim();
    if (L.length) parts.push(L.join("\n"));
    if (h) parts.push(h);
    return parts.join("\n\n");
  }
  function crewCopy(d) {
    var b = crewBody(d);
    return titleOf(d) + (b ? "\n\n" + b : "");
  }
  function cryptidLabel(name) {
    var e = entryByName(name);
    if (!e) return name;
    var xp = EN.gmEngine && EN.gmEngine.xpOf ? EN.gmEngine.xpOf(e) : 0;
    return e.name + " (Grade " + e.grade + " " + (e.designation || "") + (xp ? ", " + xp + " XP" : "") + ")";
  }
  function crewNames(ids) {
    var roster = (EN.store.roster && EN.store.roster()) || {};
    return (ids || []).map(function (id) {
      var ch = own(roster, id) ? roster[id] : null;
      if (!ch) return "a record no longer on this device";
      return ((ch.firstName || "") + " " + (ch.lastName || "")).trim() || ch.name || "Freelancer";
    });
  }
  function gmCopy(d) {
    var P = d.picks, out = [], h = String(d.hook || "").trim(), n = String(d.gmNotes || "").trim();
    out.push(titleOf(d) + " (Grade " + gradeOf(d) + ", " + statusOf(d.status).label + ")");
    out.push("");
    out.push("FOR THE CREW");
    crewLines(d, false).forEach(function (l) { out.push(l); });
    if (h) out.push("Hook: " + h);
    out.push("");
    out.push("GM ONLY");
    if (P.job2) out.push("The part the client did not mention: " + jobLine(P.job2, false));
    if (P.opposition) {
      out.push("Opposition: " + P.opposition.text);
      if (P.opposition.cryptid) out.push("Cryptid: " + cryptidLabel(P.opposition.cryptid));
    }
    if (P.complication) out.push("Complication" + (realThreat(d) ? " (the real threat)" : "") + ": " + P.complication.text);
    if (n) out.push("Notes: " + n);
    if (d.postingId) out.push("Seeded from posting " + pad2(d.postingId) + ".");
    if (d.sentTo && d.sentTo.length) out.push("Posted to: " + crewNames(d.sentTo).join(", ") + ".");
    return out.join("\n");
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

  /* ---- the job log ----------------------------------------------------------
     put() stores a copy, rec() hands back the live record (gmstore.js), so a
     change is always a copy, edited, then put back. */
  function canonPicks(P) {
    var out = {};
    PICK_KEYS.forEach(function (k) {
      var p = P && P[k];
      out[k] = p ? { n: p.n, name: p.name || null, text: p.text || "", cryptid: p.cryptid || null } : null;
    });
    return out;
  }
  function cardKey(r) {
    return JSON.stringify({ t: r.title || "", g: r.grade, p: canonPicks(r.picks), s: r.postingId || null,
                            h: r.hook || "", n: r.gmNotes || "" });
  }
  function hasContent(d) {
    return PICK_KEYS.some(function (k) { return !!d.picks[k]; }) || !!String(d.title || "").trim() ||
           !!String(d.hook || "").trim() || !!String(d.gmNotes || "").trim() || !!d.postingId;
  }
  function isDirty(d) {
    if (!d.id) return hasContent(d);
    var r = gm.rec("jobs", d.id);
    if (!r) return true;
    return cardKey({ title: titleOf(d), grade: gradeOf(d), picks: d.picks, postingId: d.postingId,
                     hook: d.hook, gmNotes: d.gmNotes }) !== cardKey(r);
  }
  /* The record for the card. Starts from the stored copy so the fields other
     tabs write (Payroll's paydayId, an encounter plan's encounterId) and any
     field a later module adds come through a save untouched. */
  function recordOf(d) {
    var r = (d.id && copy(gm.rec("jobs", d.id))) || {};
    if (d.id) r.id = d.id;
    r.title = titleOf(d);
    r.grade = gradeOf(d);
    r.picks = copy(d.picks);
    r.postingId = d.postingId || null;
    r.hook = d.hook || "";
    r.gmNotes = d.gmNotes || "";
    r.status = d.status || "draft";
    r.sentTo = (d.sentTo || []).slice();
    if (!own(r, "encounterId")) r.encounterId = d.encounterId || null;
    if (!own(r, "paydayId")) r.paydayId = d.paydayId || null;
    return r;
  }
  function save(d, quiet) {
    // the Grade the card shows becomes the job's own, so a later crew change does not move a saved job
    d.grade = gradeOf(d);
    var id = gm.put("jobs", recordOf(d));
    if (id) {
      d.id = id;
      if (!quiet) toast(titleOf(d) + " saved to the job log.");
    } else if (!quiet) toast("The job could not be saved.");
    return id;
  }
  // the stored record owns status, sentTo and the links other tabs set; the card follows it
  function syncDraft() {
    var d = _j.draft;
    if (!d.id) return;
    var r = gm.rec("jobs", d.id);
    if (!r) { d.id = null; d.status = "draft"; d.sentTo = []; d.encounterId = null; d.paydayId = null; return; }
    d.status = r.status || "draft";
    d.sentTo = Array.isArray(r.sentTo) ? r.sentTo.slice() : [];
    d.encounterId = r.encounterId || null;
    d.paydayId = r.paydayId || null;
  }
  function openJob(id) {
    var r = gm.rec("jobs", id);
    if (!r) return false;
    var d = blankDraft();
    d.id = r.id;
    d.grade = typeof r.grade === "number" ? r.grade : null;
    PICK_KEYS.forEach(function (k) { d.picks[k] = (r.picks && r.picks[k]) ? copy(r.picks[k]) : null; });
    d.postingId = r.postingId || null;
    d.title = (r.title && r.title !== autoTitle(d)) ? r.title : "";
    d.hook = r.hook || "";
    d.gmNotes = r.gmNotes || "";
    _j.draft = d;
    _j.locks = Object.create(null);
    syncDraft();
    return true;
  }
  function setStatus(d, k) {
    if (!d.id) { d.status = k; return; }
    var r = gm.rec("jobs", d.id);
    if (!r) return;
    var c = copy(r);
    c.status = k;
    gm.put("jobs", c);
  }

  /* ---- #POST ----------------------------------------------------------------
     The recipients are the crew (ruling D4). With no crew found, every record
     on this device is offered, since a posting can go to anyone with an inbox. */
  function recipients() {
    var m = crewNow().members || [];
    if (m.length) return m;
    var roster = (EN.store.roster && EN.store.roster()) || {};
    return Object.keys(roster).map(function (k) {
      var ch = roster[k];
      return { charId: k, name: ((ch.firstName || "") + " " + (ch.lastName || "")).trim() || ch.name || "Freelancer" };
    });
  }
  function picked(id) { return own(_j.pick, id) ? !!_j.pick[id] : true; }

  function sendPost() {
    var d = _j.draft;
    var to = recipients().filter(function (m) { return picked(m.charId); });
    if (!to.length || !crewBody(d)) return;
    var prevStatus = d.status || "draft";
    var id = save(d, true);
    if (!id) { toast("The job could not be saved, so nothing was sent."); EN.app.render(); return; }
    var title = titleOf(d);
    var mail = { from: String(_j.from || "").trim() || "JOB BOARD", subj: title,
                 when: String(_j.when || "").trim() || nowWhen(), body: crewBody(d) };
    var writes = [], names = [], failed = [];
    to.forEach(function (m) {
      // the tag lets the ledger itself say which job a posting belongs to (F4, F15)
      var w = gm.writeCrew(m.charId, "Job posting: " + title, [{ op: "post", mail: mail }], { source: "posting", jobId: id });
      if (w) { writes.push({ id: w, charId: m.charId }); names.push(m.name); }
      else failed.push(m.name);
    });
    if (writes.length) {
      var c = copy(gm.rec("jobs", id));
      var had = Array.isArray(c.sentTo) ? c.sentTo : [];
      var added = writes.map(function (w) { return w.charId; }).filter(function (x) { return had.indexOf(x) === -1; });
      // a job already Taken, Done or Paid keeps its status; one still on the board is now Posted
      var setPosted = (c.status || "draft") === "draft";
      if (setPosted) c.status = "posted";
      c.sentTo = had.concat(added);
      // kept on the job, so a withdrawal after a reload still puts sentTo and the status back
      c.sends = (Array.isArray(c.sends) ? c.sends : []).concat([{ at: Date.now(), writes: writes, added: added,
                                                                  setPosted: setPosted, prevStatus: prevStatus }]);
      gm.put("jobs", c, { immediate: true });
    }
    toast((writes.length ? "Posted to " + names.join(", ") + "." : "Nothing was sent.") +
          (failed.length ? " Not delivered: " + failed.join(", ") + "." : ""));
    EN.app.render();
  }

  /* ---- withdrawing a posting --------------------------------------------------
     Everything here is read from the ledger and the job record, never from
     memory, so neither a reload nor a trip to another job can strand a
     posting (F4, F15). */
  // the send on job record r that filed ledger write `wid`, or null
  function sendOf(r, wid) {
    var S = (r && Array.isArray(r.sends)) ? r.sends : [];
    for (var i = S.length - 1; i >= 0; i--) {
      var ws = (S[i] && Array.isArray(S[i].writes)) ? S[i].writes : [];
      for (var k = 0; k < ws.length; k++) if (ws[k] && ws[k].id === wid) return S[i];
    }
    return null;
  }
  /* Whether ledger write w is a posting of job `jobId`: its tag says so, or,
     for a store that does not keep tags, the job's own send list names it. */
  function isPostingOf(w, jobId) {
    if (!w || !jobId) return false;
    var m = w.meta;
    if (m && typeof m === "object" && m.source) return m.source === "posting" && m.jobId === jobId;
    return !!sendOf(gm.rec("jobs", jobId), w.id);
  }
  // the write UNDO POSTING takes back: the newest undoable GM write, when it is a posting of the job on the card
  function undoTarget() {
    var d = _j.draft;
    if (!d.id || !gm.undoable) return null;
    var u = gm.undoable();
    return isPostingOf(u, d.id) ? u : null;
  }
  // a write taken back; a ledger record that is gone (or never was) is left alone
  function withdrawn(wid) {
    var w = gm.rec("ledger", wid);
    return !!(w && w.undone === true);
  }
  /* Brings every job's sentTo and status in line with its sends. A posting
     can be withdrawn by UNDO POSTING or by the undo strip on any Admin tab, so
     this runs on every render rather than only after this file's own undo.
     Only a withdrawal (a write marked undone) sets it off. A send whose other
     postings still stand keeps them and drops the withdrawn names; once no
     posting of the send stands (each one withdrawn, or its record deleted
     since, which took the posting with it), the send leaves the list and the
     status goes back, if it is still the Posted the send set. An imported
     write is history and never undone here, so an import changes nothing.
     Returns how many jobs it changed. */
  function reconcileSends() {
    var changed = 0;
    var roster = (EN.store.roster && EN.store.roster()) || {};
    gm.list("jobs").forEach(function (r) {
      if (!r || !Array.isArray(r.sends) || !r.sends.length) return;
      var c = copy(r), dirty = false;
      c.sentTo = Array.isArray(c.sentTo) ? c.sentTo.slice() : [];
      c.sends = c.sends.filter(function (s) {
        var ws = (s && Array.isArray(s.writes)) ? s.writes.filter(Boolean) : [];
        var back = ws.filter(function (w) { return withdrawn(w.id); });
        if (!back.length) return true;
        dirty = true;
        var added = Array.isArray(s.added) ? s.added : [];
        var left = ws.filter(function (w) { return !withdrawn(w.id); });
        var standing = left.filter(function (w) { return own(roster, w.charId); });
        (standing.length ? back : ws).forEach(function (w) {
          if (added.indexOf(w.charId) !== -1) c.sentTo = c.sentTo.filter(function (x) { return x !== w.charId; });
        });
        if (standing.length) {
          s.writes = left;
          s.added = added.filter(function (x) { return !back.some(function (w) { return w.charId === x; }); });
          return true;
        }
        if (s.setPosted && c.status === "posted") c.status = s.prevStatus || "draft";
        return false;
      });
      if (dirty) { gm.put("jobs", c, { silent: true }); changed++; }
    });
    return changed;
  }
  function undoSend() {
    var jobId = _j.draft.id, u = undoTarget();
    if (!u) { toast("Nothing left to undo."); EN.app.render(); return; }
    // the whole send the top write belongs to; one write at a time when no send was kept for it
    var send = sendOf(gm.rec("jobs", jobId), u.id);
    var ids = send ? send.writes.map(function (w) { return w && w.id; }) : [u.id];
    var names = [], stuck = false;
    while ((u = gm.undoable()) && ids.indexOf(u.id) !== -1) {
      var r = gm.undoLast();
      if (!r) { stuck = true; break; }
      names.push(crewNames([r.charId])[0]);
    }
    reconcileSends();
    toast((names.length ? "Posting withdrawn from " + names.join(", ") + "." : "Nothing was withdrawn.") +
          (stuck ? " The browser refused a save, so the rest is still in place." : ""));
    EN.app.render();
  }

  /* ---- links to the other tabs ------------------------------------------------
     The Bestiary entries an opposition row points at: the cryptid pulled for
     06, the entries a row names, or a named category at the job's Grade. */
  function oppositionEntries(d) {
    var p = d.picks.opposition;
    if (!p) return [];
    var row = rowOf("opposition", p.n) || {};
    var L = row.links || {};
    var names = [];
    if (p.cryptid) names = [p.cryptid];
    else if (L.bestiary) names = L.bestiary.slice();
    else if (L.category) names = nearest(L.category, gradeOf(d)).map(function (e) { return e.name; });
    return names;
  }
  function handoff(tab, payload) {
    if (EN.gmView && EN.gmView.handoff) EN.gmView.handoff(tab, payload);
  }
  function viewBtn(name) {
    return el("button.btn.sm", { title: "Open " + name + " in the Bestiary",
      onclick: function () { handoff("bestiary", { query: name }); } }, "VIEW " + name.toUpperCase());
  }
  /* A plan needs the job's id to link back, so an unsaved job is saved first.
     One of each named entry: how many to field is the encounter budget's call. */
  function addToPlan(d) {
    var names = oppositionEntries(d);
    if (!names.length) return;
    var id = d.id || save(d, true);
    var p = d.picks.opposition;
    var payload = { addLines: names.map(function (nm) { return { kind: "bestiary", name: nm, count: 1 }; }),
                    note: "The opposition for " + titleOf(d) + ": " + p.text };
    if (id) payload.jobId = id;
    handoff("encounters", payload);
  }
  function payJob(d) {
    var id = d.id || save(d, true);
    if (id) handoff("payroll", { jobId: id });
  }

  /* ---- the generator ---------------------------------------------------------- */
  function dieFace(sides, n, color) {
    return el("span", { title: "d" + sides + (n ? ": " + n : ""), style: { display: "inline-flex", alignItems: "center" },
      html: EN.ui.dieFaceSvg(sides, { size: 30, value: n || "", edge: color, num: color }) });
  }
  function optionText(r) {
    var t = (r.name ? r.name + ": " : "") + r.text;
    return pad2(r.n) + "  " + (t.length > 72 ? t.slice(0, 70) + "..." : t);
  }
  function rowSelect(key, rows, cur, disabled, onPick) {
    return el("select", { disabled: !!disabled, style: { width: "100%", maxWidth: "100%", fontSize: "13px", padding: "6px 8px" },
      onchange: function (e) { onPick(Number(e.target.value) || 0); EN.app.render(); } },
      [el("option", { value: "0", selected: !cur }, "Pick a row...")].concat(rows.map(function (r) {
        return el("option", { value: String(r.n), selected: r.n === cur }, optionText(r));
      })));
  }
  /* The rule an instruction sends the GM to, in the Codex: the hunt procedure
     (Cryptids of Elysium, in Running Threats' Bestiary panel), the Sit-Down,
     and for "reference" (posting 8, Anomaly response) the PHB's Flow
     Disturbances (the Codex's fl-dist). A "?" chip only where the anchor
     resolves (EN.ui.ruleChip). The instruction's own words link the rules
     they name (the PHB's Sit-Down, Flow Disturbances), except the chip's. */
  var INSTR_RULE = { beats: ["gmt-bestiary/running-a-hunt", "Running a hunt"], sitdown: ["gms-sitdown", "Sit-Down Rules"],
                     reference: ["fl-dist", "Flow Disturbances"] };
  function instrLine(ins) {
    if (!ins) return null;
    var rule = INSTR_RULE[ins.kind] || null;
    var rc = rule ? EN.ui.ruleChip(rule[0], { title: rule[1] }) : null;
    var p = el("p.help", { style: { margin: "6px 0 0", color: "var(--gold)" } }, [
      el("span.chip", { style: { fontSize: "9px", color: "var(--gold)", borderColor: "var(--gold)", marginRight: "6px" },
        text: INSTR[ins.kind] || "NOTE" })
    ]);
    EN.ui.ruleText(p, ins.text + (rc ? " " : ""), { self: rule ? rule[0] : null });
    if (rc) p.appendChild(rc);
    return p;
  }
  /* A row in its column. With `key`, an instruction the row ends on is left off
     here, because instrLine() prints it right under the row on its own chip and
     the double bill, whose whole text is its instruction, would say it twice. */
  function rowText(p, strongColor, key) {
    if (!p) return el("p.help", { style: { margin: "8px 0 0", color: "var(--text4)" }, text: "Not rolled yet." });
    var node = el("p", { style: { margin: "8px 0 0", fontSize: "13px", lineHeight: "1.45" } });
    var body = key ? crewText(key, p) : p.text;
    if (key && instrOf(key, p) && body === p.text && body === instrOf(key, p).text) body = "";
    if (p.name) node.appendChild(el("span", { style: { fontWeight: 600, color: strongColor || "var(--text)" }, text: p.name + "." + (body ? " " : "") }));
    if (body) node.appendChild(document.createTextNode(body));
    return node;
  }

  function column(T) {
    var d = _j.draft, key = T.key, p = d.picks[key], locked = !!_j.locks[key];
    var gmOnly = !CREW_COLS[key];
    var dbl = key === "job" && !!d.picks.job2;
    var threat = key === "complication" && realThreat(d);
    var color = threat ? "var(--danger)" : gmOnly ? "var(--ember, var(--danger))" : "var(--accent)";
    var shown = dbl ? doubleN() : (p ? p.n : 0);
    var data = { col: key, n: String(p ? p.n : 0) };
    if (dbl) data.n2 = String(d.picks.job2.n);
    if (key === "opposition" && p && p.cryptid) data.cryptid = p.cryptid;
    if (threat) data.realthreat = "1";
    if (locked) data.locked = "1";

    var kids = [];
    kids.push(el("div.row.between", { style: { gap: "6px", alignItems: "center", flexWrap: "wrap" } }, [
      el("span.mono", { style: { fontSize: "11px", letterSpacing: ".12em", color: "var(--text2)" }, text: T.name.toUpperCase() }),
      tag(gmOnly ? "GM ONLY" : "CREW SEES", gmOnly ? "var(--danger)" : "var(--accent)")
    ]));
    kids.push(el("div.row", { style: { gap: "6px", alignItems: "center", marginTop: "8px", flexWrap: "wrap" } }, [
      dieFace(T.sides, shown, color),
      el("button.btn.sm", { disabled: locked, title: "Roll the " + T.die,
        onclick: function () { rollColumn(d, key); EN.app.render(); } }, "ROLL " + T.die),
      el("button.btn.sm" + (locked ? ".primary" : ""), { disabled: !p && !locked,
        title: locked ? "Unlock this column so it rolls again" : "Keep this row through ROLL ALL",
        onclick: function () { if (locked) delete _j.locks[key]; else _j.locks[key] = true; EN.app.render(); } },
        locked ? "LOCKED" : "LOCK")
    ]));
    kids.push(el("div", { style: { marginTop: "8px" } }, [
      rowSelect(key, T.rows, shown, locked, function (n) { setPick(d, key, n); })
    ]));

    if (dbl) {
      // the double bill: its own row, then the two jobs it rolled, each re-pickable
      var plain = T.rows.filter(function (r) { return !isDouble(r.n); });
      var dblRow = pickOf(rowOf("job", doubleN()));
      kids.push(rowText(dblRow, null, "job"));
      kids.push(instrLine(instrOf("job", dblRow)));
      kids.push(fieldHead("TOLD TO THE CREW", "var(--accent)"));
      kids.push(rowSelect("job", plain, d.picks.job ? d.picks.job.n : 0, locked, function (n) {
        if (n) d.picks.job = pickOf(rowOf("job", n));
      }));
      kids.push(rowText(d.picks.job, null, "job"));
      kids.push(instrLine(instrOf("job", d.picks.job)));
      kids.push(fieldHead("THE PART THE CLIENT DID NOT MENTION", "var(--danger)"));
      kids.push(rowSelect("job", plain, d.picks.job2.n, locked, function (n) {
        if (n) d.picks.job2 = pickOf(rowOf("job", n));
      }));
      kids.push(rowText(d.picks.job2, "var(--danger)", "job"));
      kids.push(instrLine(instrOf("job", d.picks.job2)));
    } else {
      kids.push(rowText(p, null, key));
      kids.push(instrLine(instrOf(key, p)));
    }

    if (key === "opposition" && p && needsCryptid(d)) {
      var e = p.cryptid ? entryByName(p.cryptid) : null, gNow = gradeOf(d);
      var tail = (!e || e.grade === gNow) ? "" : cryptidFits(d) ? ", the nearest Grade with a cryptid"
        : ". That is not this job's Grade: pull again to match it.";
      kids.push(el("div.row.wrap", { style: { gap: "6px", alignItems: "center", marginTop: "6px" } }, [
        el("span.help", { style: { margin: 0, color: tail && !cryptidFits(d) ? "var(--warn)" : "var(--text2)" },
          text: p.cryptid ? "Pulled for Grade " + gNow + ": " + cryptidLabel(p.cryptid) + tail
                          : "No cryptid in the Bestiary to pull." }),
        el("button.btn.sm", { disabled: locked, onclick: function () { pullCryptid(d, p.cryptid); EN.app.render(); } }, "PULL AGAIN")
      ]));
    }
    if (threat) {
      kids.push(el("p.help", { style: { margin: "6px 0 0", color: "var(--danger)" } }, [
        tag("THE REAL THREAT", "var(--danger)"),
        document.createTextNode(" The opposition is nobody, so this is what the crew is up against.")
      ]));
    }
    // a complication that names a cryptid is kept when the job has none (ruling); the GM adapts it
    if (key === "complication" && p && /cryptid/i.test(p.text) && !hasCryptid(d)) {
      kids.push(el("p.help", { style: { margin: "6px 0 0" }, text: "There is no cryptid in this job. Kept anyway: adapt it to what the crew is facing." }));
    }
    return el("div.feature", { dataset: data,
      style: { flex: "1 1 210px", minWidth: "0", margin: "0", borderLeftColor: color,
               boxShadow: threat ? "0 0 0 1px var(--danger)" : "none" } }, kids);
  }
  /* Whether anything in the job is a cryptid: one pulled for the opposition, a
     row that points at the cryptid category (a Cryptid hunt), or a Bestiary
     name, on a row or the seeding posting, that is filed under cryptids. */
  function hasCryptid(d) {
    var P = d.picks;
    if (P.opposition && P.opposition.cryptid) return true;
    var found = false;
    ["client", "job", "job2", "site", "opposition"].forEach(function (k) {
      var row = P[k] ? rowOf(k === "job2" ? "job" : k, P[k].n) : null;
      var L = (row && row.links) || {};
      if (L.category === "cryptids") found = true;
      (L.bestiary || []).forEach(function (nm) { var e = entryByName(nm); if (e && e.category === "cryptids") found = true; });
    });
    var post = d.postingId ? postingOf(d.postingId) : null;
    ((post && post.links && post.links.bestiary) || []).forEach(function (nm) {
      var e = entryByName(nm);
      if (e && e.category === "cryptids") found = true;
    });
    return found;
  }

  function generatorPanel() {
    var B = book();
    var cols = B.order.map(function (k) { return tableOf(k); }).filter(Boolean).map(column);
    return EN.ui.panel("Generator", "ROLL · PICK · LOCK", [
      el("div.row.wrap", { style: { gap: "10px", alignItems: "stretch" } }, cols)
    ], { headerRight: [el("button.btn.sm.primary", { onclick: rollAll }, "ROLL ALL")] });
  }

  /* ---- the job card ---------------------------------------------------------- */
  // the crew's own Heat, Debts and Cred, read off ch.face (the Social tab's shapes, js/face.js)
  function crewTies() {
    var roster = (EN.store.roster && EN.store.roster()) || {};
    var out = [];
    (crewNow().members || []).forEach(function (m) {
      var ch = own(roster, m.charId) ? roster[m.charId] : null;
      var f = (ch && ch.face) || {};
      (f.heat || []).forEach(function (h) {
        if (!h || !String(h.source || "").trim()) return;
        out.push({ group: "Heat", label: m.name + ": " + h.source + " (" + (h.value || 0) + ")",
                   text: h.source + ", the Heat on " + m.name + "." });
      });
      (f.debts || []).forEach(function (x) {
        if (!x || !String(x.who || "").trim()) return;
        var terms = String(x.terms || "").trim();
        var line = x.dir === "owed" ? x.who + " owes " + m.name : m.name + " owes " + x.who;
        out.push({ group: "Debts", label: line + (terms ? ": " + terms : ""), text: line + (terms ? ": " + terms : "") + "." });
      });
      (f.cred || []).forEach(function (c) {
        if (!c || !String(c.scene || "").trim()) return;
        out.push({ group: "Cred", label: m.name + ": " + c.scene + " (" + (c.value || 0) + ")",
                   text: m.name + "'s Cred with " + c.scene + "." });
      });
    });
    return out;
  }
  function tiePicker(d) {
    var ties = crewTies();
    if (!ties.length) {
      return el("p.help", { style: { margin: "6px 0 0" },
        text: crewNow().members.length ? "The crew's records carry no Heat, Debts or Cred yet." : "No crew yet. File a Freelancer or pull one onto the Table." });
    }
    var groups = ["Heat", "Debts", "Cred"].map(function (g) {
      var opts = [];
      ties.forEach(function (t, i) { if (t.group === g) opts.push(el("option", { value: String(i) }, t.label)); });
      return opts.length ? el("optgroup", { label: g }, opts) : null;
    }).filter(Boolean);
    return el("select", { style: { width: "100%", maxWidth: "100%", fontSize: "13px", padding: "6px 8px", marginTop: "6px" },
      onchange: function (e) {
        var t = ties[Number(e.target.value)];
        if (!t || e.target.value === "") return;
        var h = String(d.hook || "").replace(/\s+$/, "");
        d.hook = (h ? h + "\n" : "") + t.text;
        EN.app.render();
      } }, [el("option", { value: "", selected: true }, "Tie it to the crew: their Heat, Debts or Cred...")].concat(groups));
  }
  // no re-render on change: the state is kept on input and what depends on it is repainted in place (F19)
  function textArea(val, ph, onInput) {
    return el("textarea", { value: val || "", placeholder: ph,
      style: { width: "100%", minHeight: "72px", fontSize: "13px" },
      oninput: function (e) { onInput(e.target.value); paintLive(); } });
  }
  function partLine(head, node, color) {
    return el("div", null, [fieldHead(head, color), node]);
  }

  /* The card's parts that follow the typing, each built from the draft as it
     stands, so render() and paintLive() draw them the same way. */
  function cardSub(d) { return (titleOf(d) + " · G" + gradeOf(d)).toUpperCase(); }
  function cardHead(d) {
    var head = [];
    if (d.postingId) head.push(tag("SEED " + pad2(d.postingId), "var(--accent)"));
    head.push(isDirty(d) ? tag(d.id ? "UNSAVED CHANGES" : "NOT SAVED", "var(--warn)") : tag("IN THE LOG", "var(--success)"));
    return head;
  }
  function cardActs(d) {
    var newBtn = isDirty(d)
      ? EN.ui.armButton("gmjobs:new", { label: "NEW JOB", armedLabel: "DISCARD THE CARD?", cls: ".btn.sm",
          armedTitle: "The card has unsaved changes. Click again to clear it.",
          onConfirm: function () { _j.draft = blankDraft(); _j.locks = Object.create(null); EN.app.render(); } })
      : el("button.btn.sm", { onclick: function () { _j.draft = blankDraft(); _j.locks = Object.create(null); EN.app.render(); } }, "NEW JOB");
    return [
      el("button.btn.sm.primary", { disabled: !hasContent(d), onclick: function () { save(d); EN.app.render(); } },
        d.id ? "SAVE CHANGES" : "SAVE TO THE LOG"),
      el("button.btn.sm", { disabled: !hasContent(d), title: "Open Payroll with this job",
        onclick: function () { payJob(d); } }, "PAY THIS JOB"),
      newBtn,
      d.paydayId ? tag("PAID OUT", "var(--flow)") : null,
      d.encounterId ? tag("PLAN LINKED", "var(--accent)") : null
    ];
  }

  function cardPanel() {
    var d = _j.draft, P = d.picks, crew = crewNow(), g = gradeOf(d), B = book();
    var kids = [];

    // title, Grade, status
    kids.push(el("div.row.wrap", { style: { gap: "10px", alignItems: "flex-end" } }, [
      el("div.field", { style: { margin: 0, flex: "2 1 220px", minWidth: "0" } }, [
        lbl("Title"),
        el("input", { type: "text", value: d.title || "", placeholder: titleOf({ title: "", picks: P, postingId: d.postingId }),
          oninput: function (e) { d.title = e.target.value; paintLive(); } })
      ]),
      el("div.field", { style: { margin: 0, flex: "0 1 150px" } }, [
        lbl("Grade"),
        el("select", { onchange: function (e) { d.grade = Number(e.target.value); recheckCryptid(d); EN.app.render(); } },
          [1, 2, 3, 4, 5].map(function (n) {
            var tail = (d.grade == null && n === g) ? " (crew Caliber)" : "";
            return el("option", { value: String(n), selected: n === g }, "G" + n + tail);
          }))
      ]),
      el("div.field", { style: { margin: 0, flex: "0 1 150px" } }, [
        lbl("Status"),
        el("select", { style: { color: statusOf(d.status).color },
          onchange: function (e) { setStatus(d, e.target.value); EN.app.render(); } },
          STATUSES.map(function (s) { return el("option", { value: s.k, selected: s.k === d.status }, s.label); }))
      ])
    ]));
    var crewLine = crew.members.length
      ? "The site's Grade. It follows the crew's Caliber " + crew.caliber + " (" + crew.members.map(function (m) {
          return m.name + (m.caliber ? " C" + m.caliber : "");
        }).join(", ") + ") until you pick one, and it sets the cryptid pull."
      : "The site's Grade. No crew found, so it starts at 1; pick the Grade the job runs at.";
    kids.push(el("p.help", { style: { margin: "6px 0 0" }, text: crewLine }));

    // what the crew is told
    var crewSide = [
      el("div.row.between.wrap", { style: { gap: "6px", alignItems: "center" } }, [
        el("span.mono", { style: { fontSize: "11px", letterSpacing: ".14em", color: "var(--accent)" }, text: "FOR THE CREW" }),
        tag("PLAYER-FACING", "var(--accent)")
      ]),
      partLine("CLIENT", P.client ? el("p", { style: { margin: 0, fontSize: "13px" }, text: crewText("client", P.client) })
        : el("p.help", { style: { margin: 0, color: "var(--text4)" }, text: "Not rolled yet." })),
      partLine(P.job2 ? "JOB, AS THE CLIENT TELLS IT" : "JOB", P.job ? el("p", { style: { margin: 0, fontSize: "13px" }, text: jobLine(P.job, true) })
        : el("p.help", { style: { margin: 0, color: "var(--text4)" }, text: "Not rolled yet." })),
      partLine("SITE", P.site ? el("p", { style: { margin: 0, fontSize: "13px" }, text: crewText("site", P.site) })
        : el("p.help", { style: { margin: 0, color: "var(--text4)" }, text: "Not rolled yet." })),
      fieldHead("THE HOOK"),
      textArea(d.hook, "Why this crew, why tonight. A posting, a name from their past, a debt coming due.",
        function (v) { d.hook = v; }),
      tiePicker(d)
    ];
    if (B.guidance) {
      crewSide.push(el("p.help", { style: { margin: "8px 0 0", color: "var(--text2)" } }, [
        el("span", { style: { color: "var(--gold)", fontWeight: 600 }, text: B.guidance.label + ". " }),
        document.createTextNode(B.guidance.text)
      ]));
    }

    // what only the GM knows
    var gmSide = [
      el("div.row.between.wrap", { style: { gap: "6px", alignItems: "center" } }, [
        el("span.mono", { style: { fontSize: "11px", letterSpacing: ".14em", color: "var(--danger)" }, text: "BEHIND THE SCREEN" }),
        tag("GM ONLY", "var(--danger)")
      ])
    ];
    if (P.job2) {
      gmSide.push(partLine("THE PART THE CLIENT DID NOT MENTION",
        el("p", { style: { margin: 0, fontSize: "13px" }, text: jobLine(P.job2, false) }), "var(--danger)"));
    }
    var oppKids = [];
    if (P.opposition) {
      oppKids.push(el("p", { style: { margin: 0, fontSize: "13px" }, text: P.opposition.text }));
      if (P.opposition.cryptid) {
        oppKids.push(el("p.help", { style: { margin: "4px 0 0", color: "var(--text2)" }, text: "Cryptid: " + cryptidLabel(P.opposition.cryptid) }));
      }
      var names = oppositionEntries(d);
      if (names.length) {
        oppKids.push(el("div.row.wrap", { style: { gap: "6px", marginTop: "6px" } },
          names.map(viewBtn).concat([
            el("button.btn.sm.primary", { title: "Hand these to the Encounters tab as lines for a plan",
              onclick: function () { addToPlan(d); } }, "+ ADD TO ENCOUNTER PLAN")
          ])));
      }
    } else {
      oppKids.push(el("p.help", { style: { margin: 0, color: "var(--text4)" }, text: "Not rolled yet." }));
    }
    gmSide.push(partLine("OPPOSITION", el("div", null, oppKids)));
    var compKids = [];
    if (P.complication) {
      if (realThreat(d)) compKids.push(el("div", { style: { marginBottom: "4px" } }, [tag("THE REAL THREAT", "var(--danger)")]));
      compKids.push(el("p", { style: { margin: 0, fontSize: "13px" }, text: P.complication.text }));
    } else {
      compKids.push(el("p.help", { style: { margin: 0, color: "var(--text4)" }, text: "Not rolled yet." }));
    }
    gmSide.push(partLine("COMPLICATION", el("div", null, compKids), realThreat(d) ? "var(--danger)" : null));
    gmSide.push(fieldHead("GM NOTES"));
    gmSide.push(textArea(d.gmNotes, "The seams: who is lying, what the job is really for, where it goes wrong.",
      function (v) { d.gmNotes = v; }));

    // other linked rows: a VIEW for every Bestiary name the client, job, site or posting points at
    var seen = Object.create(null), extra = [];
    oppositionEntries(d).forEach(function (n) { seen[n] = true; });
    ["client", "job", "job2", "site"].forEach(function (k) {
      var p = P[k], row = p ? rowOf(k === "job2" ? "job" : k, p.n) : null;
      ((row && row.links && row.links.bestiary) || []).forEach(function (n) { if (!seen[n]) { seen[n] = true; extra.push(n); } });
    });
    var post = d.postingId ? postingOf(d.postingId) : null;
    ((post && post.links && post.links.bestiary) || []).forEach(function (n) { if (!seen[n]) { seen[n] = true; extra.push(n); } });
    if (extra.length) {
      gmSide.push(fieldHead("ALSO IN THE BESTIARY"));
      gmSide.push(el("div.row.wrap", { style: { gap: "6px" } }, extra.map(viewBtn)));
    }

    kids.push(el("div.row.wrap", { style: { gap: "12px", alignItems: "stretch", marginTop: "12px" } }, [
      el("div", { dataset: { side: "crew" }, style: { flex: "1 1 260px", minWidth: "0", border: "1px solid var(--accent-dim, var(--accent))",
        borderRadius: "3px", padding: "10px 12px" } }, crewSide),
      el("div", { dataset: { side: "gm" }, style: { flex: "1 1 260px", minWidth: "0", border: "1px dashed var(--danger)",
        borderRadius: "3px", padding: "10px 12px", background: "var(--bg1)" } }, gmSide)
    ]));

    // the job's own actions, and the header tags, repainted in place while the GM types
    var acts = el("div.row.wrap", { dataset: { live: "card-acts" }, style: { gap: "8px", marginTop: "12px", alignItems: "center" } }, cardActs(d));
    kids.push(acts);
    var head = el("span", { dataset: { live: "card-head" }, style: { display: "inline-flex", gap: "8px", alignItems: "center", flexWrap: "wrap" } }, cardHead(d));
    var p = EN.ui.panel("Job Card", cardSub(d), kids, { headerRight: [head] });
    if (_paint) {
      _paint.cardActs = acts;
      _paint.cardHead = head;
      _paint.cardTag = p.querySelector(".panel-h .tag");
    }
    return p;
  }

  /* ---- handing it out ------------------------------------------------------------ */
  function textBox(kind, text) {
    return el("div", { dataset: { copy: kind },
      style: { whiteSpace: "pre-wrap", fontSize: "12.5px", lineHeight: "1.45", background: "var(--bg1)",
               border: "1px solid var(--border)", borderRadius: "3px", padding: "8px 10px", maxHeight: "240px",
               overflowY: "auto", color: "var(--text2)", userSelect: "text" }, text: text });
  }
  function refill(node, kids) {
    if (!node || !node.isConnected) return;
    EN.ui.clear(node);
    kids.forEach(function (k) { if (k) node.appendChild(k); });
  }
  /* What each live part is drawn from, as a string. A part is rebuilt only
     when its string changes, so typing inside an already unsaved card swaps
     no button at all: only the keystroke that flips a state (the first one,
     usually) rebuilds the buttons that state draws. */
  function liveSig(d) {
    var dirty = isDirty(d);
    var to = recipients().filter(function (m) { return picked(m.charId); }).map(function (m) { return m.charId; });
    var u = undoTarget();
    return {
      head: JSON.stringify([d.postingId || 0, dirty, !!d.id]),
      acts: JSON.stringify([dirty, hasContent(d), !!d.id, d.paydayId || 0, d.encounterId || 0]),
      send: JSON.stringify([!!crewBody(d), to, u ? u.id : 0, d.sentTo || []]),
      log: JSON.stringify([dirty, d.id || 0, gm.list("jobs").length])
    };
  }
  /* Called on every keystroke in the title, hook and GM notes (F19). Nothing
     the GM is typing into is rebuilt, so focus and the caret stay put, and a
     button pressed right after typing is the same node the click lands on. */
  function paintLive() {
    if (!_paint) return;
    var d = _j.draft;
    if (_paint.crew && _paint.crew.isConnected) _paint.crew.textContent = crewCopy(d);
    if (_paint.gm && _paint.gm.isConnected) _paint.gm.textContent = gmCopy(d);
    if (_paint.cardTag && _paint.cardTag.isConnected) _paint.cardTag.textContent = cardSub(d);
    var s = liveSig(d), was = _paint.sig || {};
    if (s.head !== was.head) refill(_paint.cardHead, cardHead(d));
    if (s.acts !== was.acts) refill(_paint.cardActs, cardActs(d));
    if (s.send !== was.send) refill(_paint.sendActs, sendActs(d));
    // the log's OPEN buttons ask first while the card is unsaved, so the log follows too
    if (s.log !== was.log && _paint.log && _paint.log.isConnected && _paint.log.parentNode) {
      var fresh = logPanel();
      _paint.log.parentNode.replaceChild(fresh, _paint.log);
      _paint.log = fresh;
    }
    _paint.sig = s;
  }
  // SEND TO #POST, UNDO POSTING and who it went to: they follow the hook as it is typed
  function sendActs(d) {
    var list = recipients();
    var to = list.filter(function (m) { return picked(m.charId); });
    var body = crewBody(d);
    var acts = [];
    if (to.length && body) {
      acts.push(EN.ui.armButton("gmjobs:send", { label: "SEND TO #POST", cls: ".btn.sm",
        armedLabel: "SEND TO " + to.length + (to.length === 1 ? " RECORD?" : " RECORDS?"),
        title: "Post the crew's text to the chosen records",
        armedTitle: "Writes a #POST message into " + to.map(function (m) { return m.name; }).join(", ") + ". UNDO takes it back.",
        onConfirm: sendPost }));
    } else {
      acts.push(el("button.btn.sm", { disabled: true, title: body ? "Choose who receives it" : "Roll or write the job first" }, "SEND TO #POST"));
    }
    var u = undoTarget();
    if (u) {
      // who still has this send's posting: the ledger's standing writes (liveWrites), not this file's memory
      var send = sendOf(gm.rec("jobs", d.id), u.id);
      var live = (typeof gm.liveWrites === "function") ? gm.liveWrites(function (r) { return isPostingOf(r, d.id); }) : null;
      var stands = function (w) {
        return !!w && (live ? live.some(function (r) { return r.id === w.id; }) : !withdrawn(w.id));
      };
      var who = send ? send.writes.filter(stands).map(function (w) { return w.charId; }) : [u.charId];
      acts.push(el("button.btn.sm", { dataset: { undo: "posting" },
        title: "Take the posting back out of " + crewNames(who).join(", ") + (who.length === 1 ? "'s inbox" : "'s inboxes"),
        onclick: undoSend }, "UNDO POSTING"));
    }
    if (d.sentTo.length) {
      acts.push(el("span.help", { style: { margin: 0 }, text: "Posted to " + crewNames(d.sentTo).join(", ") + "." }));
    }
    return acts;
  }

  function handOutPanel() {
    var d = _j.draft, kids = [];
    var crewBox = textBox("crew", crewCopy(d)), gmBox = textBox("gm", gmCopy(d));
    if (_paint) { _paint.crew = crewBox; _paint.gm = gmBox; }
    kids.push(el("div.row.wrap", { style: { gap: "12px", alignItems: "flex-start" } }, [
      el("div", { style: { flex: "1 1 260px", minWidth: "0" } }, [
        fieldHead("FOR THE CREW: CLIENT, JOB, SITE AND HOOK", "var(--accent)"), crewBox,
        el("button.btn.sm", { style: { marginTop: "6px" }, onclick: function () { copyText(crewCopy(_j.draft), "The crew's text"); } }, "COPY FOR THE CREW")
      ]),
      el("div", { style: { flex: "1 1 260px", minWidth: "0" } }, [
        fieldHead("THE GM'S FULL TEXT", "var(--danger)"), gmBox,
        el("button.btn.sm", { style: { marginTop: "6px" }, onclick: function () { copyText(gmCopy(_j.draft), "The GM's text"); } }, "COPY GM TEXT")
      ])
    ]));

    kids.push(EN.ui.sectionTitle("Send to #POST"));
    kids.push(el("p.help", { style: { margin: "0 0 8px" },
      text: "Files the crew's text in each record's #POST inbox, unread, from this device. The opposition and the complication stay here. For a crew on other devices, COPY FOR THE CREW and paste it." }));
    var list = recipients();
    if (!list.length) {
      kids.push(el("p.help", { style: { color: "var(--text4)" }, text: "No records on this device to post to." }));
    } else {
      kids.push(el("div.row.wrap", { style: { gap: "6px", marginBottom: "8px" } }, list.map(function (m) {
        var on = picked(m.charId);
        var sent = d.sentTo.indexOf(m.charId) !== -1;
        return el("span.chip" + (on ? ".on" : ""), { dataset: { recipient: m.charId },
          style: { cursor: "pointer", fontSize: "10.5px" }, title: on ? "Will receive the posting" : "Will not receive it",
          onclick: function () { _j.pick[m.charId] = !on; EN.app.render(); } },
          (on ? "✓ " : "") + m.name + (sent ? " (posted)" : ""));
      })));
    }
    kids.push(el("div.row.wrap", { style: { gap: "10px", alignItems: "flex-end" } }, [
      el("div.field", { style: { margin: 0, flex: "1 1 160px", minWidth: "0" } }, [
        lbl("From"),
        el("input", { type: "text", value: _j.from, placeholder: "JOB BOARD",
          oninput: function (e) { _j.from = e.target.value; } })
      ]),
      el("div.field", { style: { margin: 0, flex: "1 1 160px", minWidth: "0" } }, [
        lbl("When"),
        el("input", { type: "text", value: _j.when, placeholder: nowWhen(),
          oninput: function (e) { _j.when = e.target.value; } })
      ])
    ]));
    var acts = el("div.row.wrap", { dataset: { live: "send-acts" }, style: { gap: "8px", alignItems: "center", marginTop: "10px" } }, sendActs(d));
    if (_paint) _paint.sendActs = acts;
    kids.push(acts);
    return EN.ui.panel("Hand It Out", "COPY · #POST", kids);
  }

  /* ---- the Twelve Postings ------------------------------------------------------ */
  function seedPosting(n) {
    var d = _j.draft, row = postingOf(n);
    if (!row) return;
    // a posting replaces the one it seeded before, and keeps whatever the GM wrote after it
    var old = d.postingId ? postingOf(d.postingId) : null;
    var h = String(d.hook || "");
    if (old && h.indexOf(old.text) === 0) h = h.slice(old.text.length).replace(/^\s+/, "");
    d.hook = row.text + (h ? "\n\n" + h : "");
    d.postingId = n;
    toast("Posting " + pad2(n) + " seeds the hook.");
    EN.app.render();
  }
  function postingsPanel() {
    var B = book(), P = B.postings, d = _j.draft, kids = [];
    kids.push(el("p.help", { style: { margin: "0 0 8px" }, text: P.intro }));
    P.rows.forEach(function (r) {
      var hit = _j.postN === r.n, seeded = d.postingId === r.n;
      var links = ((r.links && r.links.bestiary) || []).map(viewBtn);
      kids.push(el("div.row.between.wrap", { dataset: { posting: String(r.n) },
        style: { gap: "8px", alignItems: "center", padding: "7px 8px", borderBottom: "1px solid var(--border)",
                 borderLeft: "3px solid " + (hit ? "var(--accent)" : "transparent"), background: hit ? "var(--bg2)" : "transparent" } }, [
        el("div.row", { style: { gap: "10px", alignItems: "baseline", flex: "1 1 240px", minWidth: "0" } }, [
          el("span.mono", { style: { fontSize: "13px", color: hit ? "var(--accent)" : "var(--text3)" }, text: pad2(r.n) }),
          el("span", { style: { fontSize: "13px", minWidth: "0" }, text: r.text })
        ]),
        el("div.row.wrap", { style: { gap: "6px", alignItems: "center" } }, links.concat([
          seeded ? tag("SEEDED", "var(--success)") : null,
          el("button.btn.sm" + (hit ? ".primary" : ""), { onclick: function () { seedPosting(r.n); } }, "USE AS SEED")
        ]))
      ]));
    });
    return EN.ui.panel(P.name, P.die.toUpperCase() + " · ONE LINE EACH", kids, {
      headerRight: [
        _j.postN ? dieFace(P.sides, _j.postN, "var(--accent)") : null,
        el("button.btn.sm", { style: { whiteSpace: "nowrap" }, onclick: function () {
          _j.postN = die(P.sides);
          toast("Posting " + pad2(_j.postN) + ".");
          EN.app.render();
        } }, "ROLL " + P.die)
      ]
    });
  }

  /* ---- the job log --------------------------------------------------------------- */
  function logPanel() {
    var d = _j.draft, all = gm.list("jobs");
    var counts = Object.create(null);
    all.forEach(function (r) { var k = statusOf(r.status).k; counts[k] = (counts[k] || 0) + 1; });
    var kids = [];
    var chips = [{ k: "all", label: "All", n: all.length }].concat(STATUSES.map(function (s) {
      return { k: s.k, label: s.label, n: counts[s.k] || 0 };
    }));
    kids.push(el("div.row.wrap", { style: { gap: "6px", marginBottom: "8px" } }, chips.map(function (c) {
      return el("span.chip" + (_j.filter === c.k ? ".on" : ""), { dataset: { filter: c.k },
        style: { cursor: "pointer", fontSize: "10.5px" },
        onclick: function () { _j.filter = c.k; EN.app.render(); } }, c.label + " (" + c.n + ")");
    })));
    var rows = all.filter(function (r) { return _j.filter === "all" || statusOf(r.status).k === _j.filter; });
    if (!all.length) {
      kids.push(el("div.muted-box", { style: { padding: "18px" }, text: "No jobs saved yet. Roll one and save it to the log." }));
    } else if (!rows.length) {
      kids.push(el("p.help", { text: "No " + statusOf(_j.filter).label.toLowerCase() + " jobs." }));
    }
    var dirty = isDirty(d);
    rows.forEach(function (r) {
      var st = statusOf(r.status), onCard = r.id === d.id;
      var bits = [(typeof r.grade === "number" ? "G" + r.grade : "no Grade"), "saved " + fmtDay(r.createdAt)];
      if (Array.isArray(r.sentTo) && r.sentTo.length) bits.push("posted to " + r.sentTo.length);
      var open = (dirty && !onCard)
        ? EN.ui.armButton("gmjobs:open:" + r.id, { label: "OPEN", armedLabel: "DISCARD THE CARD?", cls: ".btn.sm",
            armedTitle: "The card has unsaved changes. Click again to open this job over them.",
            onConfirm: function () { openJob(r.id); EN.app.render(); } })
        : el("button.btn.sm", { disabled: onCard, onclick: function () { openJob(r.id); EN.app.render(); } }, onCard ? "ON THE CARD" : "OPEN");
      kids.push(el("div.row.between.wrap", { dataset: { job: r.id },
        style: { gap: "8px", alignItems: "center", padding: "7px 0", borderBottom: "1px solid var(--border)" } }, [
        el("div.row.wrap", { style: { gap: "8px", alignItems: "baseline", flex: "1 1 220px", minWidth: "0" } }, [
          el("span", { style: { fontWeight: 600, color: onCard ? "var(--accent)" : "var(--text)" }, text: r.title || "Untitled job" }),
          el("span.help", { style: { margin: 0 }, text: bits.join(" · ") }),
          r.paydayId ? tag("PAID OUT", "var(--flow)") : null
        ]),
        el("div.row.wrap", { style: { gap: "6px", alignItems: "center" } }, [
          el("select", { style: { width: "auto", fontSize: "12px", padding: "4px 6px", color: st.color },
            title: "Status",
            onchange: function (e) {
              var c = copy(gm.rec("jobs", r.id));
              if (!c) return;
              c.status = e.target.value;
              gm.put("jobs", c);
              EN.app.render();
            } }, STATUSES.map(function (s) { return el("option", { value: s.k, selected: s.k === st.k }, s.label); })),
          open,
          EN.ui.armButton("gmjobs:del:" + r.id, { label: "DELETE", armedLabel: "DELETE?",
            armedTitle: "Removes this job from the log. Postings already sent stay in the crew's inboxes.",
            onConfirm: function () { gm.drop("jobs", r.id); EN.app.render(); } })
        ])
      ]));
    });
    return EN.ui.panel("Job Log", all.length + (all.length === 1 ? " JOB" : " JOBS"), kids);
  }

  /* ---- the tab --------------------------------------------------------------------- */
  /* The shared "last write to a Freelancer record" strip (gm.js) under the
     heading, so the newest GM write can always be undone from here, whatever
     job is on the card (F4). Null while gm.js has no strip or nothing is
     undoable. */
  function undoStrip() {
    try {
      return (EN.gmView && typeof EN.gmView.undoStrip === "function") ? (EN.gmView.undoStrip() || null) : null;
    } catch (e) {
      try { console.error("GM Job Board: the undo strip failed", e); } catch (e2) {}
      return null;
    }
  }

  function render(mount) {
    EN.ui.clear(mount);
    _crew = null;
    _paint = {};
    var B = book();
    if (!B) {
      mount.appendChild(el("div", null, [heading("Job Board", "// roll a job"), undoStrip(),
        el("div.muted-box", { text: "Job Board data did not load. Check app/data/gm_jobs.js." })]));
      return;
    }
    // a posting withdrawn anywhere (UNDO POSTING, or the undo strip on any tab) takes its names off the job
    reconcileSends();
    // and a payday the strip took back on another tab frees its job here, before Payroll is next opened
    if (EN.gmPayroll && typeof EN.gmPayroll.reconcile === "function") EN.gmPayroll.reconcile();
    // nothing hands a job here yet; a {jobId} opens it, so a later link back from Payroll costs nothing
    var h = EN.gmView && EN.gmView.takeHandoff ? EN.gmView.takeHandoff("jobs") : null;
    if (h && h.jobId) openJob(h.jobId);
    syncDraft();
    // a Grade that follows the crew moves when the crew does, and the cryptid pull follows it
    if (_j.draft.grade == null) recheckCryptid(_j.draft);
    var gap = function () { return el("div", { style: { height: "12px" } }); };
    var log = logPanel();
    _paint.log = log;
    mount.appendChild(el("div", null, [
      heading("Job Board", "// roll a job"),
      undoStrip(),
      el("p.help", { style: { margin: "-6px 0 14px", maxWidth: "860px" }, text: B.intro }),
      generatorPanel(), gap(),
      cardPanel(), gap(),
      handOutPanel(), gap(),
      postingsPanel(), gap(),
      log
    ]));
    _paint.sig = liveSig(_j.draft);
  }

  return { render: render };
})();
