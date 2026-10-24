/* ===========================================================================
   ELYSIUM NIGHTS · Codex panels: Movement, Jumping, Falling & Forced Movement,
   Shove, Trip & Grapple, and Wall-to-Wall
   Five panels added to the Combat Rules chapter (combat, order 40, registered by
   js/codex.js) with EN.codexView.addPanels, rendered from EN.movement
   (app/data/movement.js, a transcription of the book). Panel ids "mv-":
     mv-move       Movement & Terrain           order 12, after Action Economy
     mv-jump       Jumping                      order 14
     mv-fall       Falling & Forced Movement    order 16
     mv-optfx      Optional Damage Effects That Move a Target, order 17, audience
                   "gm": the Appendix: Optional Damage Effects moved to the Game
                   Master's Toolkit (2026-10-16 handoff, section 8), so the Admin
                   desktop alone carries its two moving Effects. Their rows are
                   READ from EN.threats.optionalDamageEffects (the appendix's one
                   copy; EN.movement.movingEffectNames says which two), and the
                   panel links the whole appendix, gmt-damage-effects
     mv-maneuvers  Shove, Trip & Grapple        order 18, before Active Defenses
     mv-wall       Wall-to-Wall                 order 35, after Cover & Sight
   Anchors worth knowing: mv-move/difficult-terrain, mv-move/through-a-body,
   mv-move/speed-reductions, mv-move/dragging-pushing-and-pulling,
   mv-jump/jump-distance, mv-jump/jump-table, mv-fall/falling-and-forced-movement,
   mv-optfx/knockback (Admin only), mv-maneuvers/shove, mv-maneuvers/trip, mv-maneuvers/grapple,
   mv-wall/rebound, mv-wall/in-a-sealed-room.
   Nothing is written here that the data does not say: every rule line is a field
   of EN.movement, and this file's own words are headings, the one app label per
   entry the data marks as the app's, and the small pointers between panels.
   The API is documented in the header of app/js/codex.js.
   =========================================================================== */
window.EN = window.EN || {};

(function () {
  if (!EN.codexView || !EN.codexView.register) return;
  var CV = EN.codexView;

  function M() { return EN.movement || null; }
  function has(field) { return function () { var m = M(); return !!(m && m[field]); }; }
  /* "Falling & Forced Movement" is mv-fall's title, so it links everywhere on its own.
     Inside these panels it also goes through linkify's per-call terms, which outrank
     every other term, so the citation in Going Farther always lands on mv-fall. */
  var FFM = { "Falling & Forced Movement": "mv-fall" };
  function admin(ctx) { return !!(ctx && ctx.portal === "admin"); }
  /* The Effects that move a Target, as rows of the Toolkit's appendix (EN.threats.optionalDamageEffects):
     the names are EN.movement's, the words are the appendix's, so there is one copy of each. */
  function fxData() { return (EN.threats && EN.threats.optionalDamageEffects) || null; }
  function movingRows() {
    var m = M(), d = fxData();
    if (!m || !d) return [];
    return (m.movingEffectNames || []).map(function (n) {
      return (d.effects || []).filter(function (e) { return e.name === n; })[0] || null;
    }).filter(Boolean);
  }
  function groupName(d, e) {
    var g = (d.groups || []).filter(function (x) { return x.key === e.group; })[0];
    return g ? g.name : String(e.group || "");
  }

  CV.addPanels("combat", [

    /* ---- 1 · the costs of moving -------------------------------------------- */
    { id: "mv-move", title: "Movement & Terrain", tag: "SPEED · TERRAIN · HAULS", order: 12, when: has("movement"), build: function (ctx, K) {
      var m = M(), d = m.dragging, cm = m.cinematicMomentum;
      return [
        // each row is a named line, so Difficult Terrain and Through a Body are anchors of their own
        K.ruleBlock("Movement", m.movement.map(function (r) { return "- " + r.name + ": " + r.text; }).join("\n")),
        m.speedReductions ? K.ruleBlock("Speed Reductions", m.speedReductions) : null,
        d ? K.ruleBlock(d.name, d.intro + "\n\n" + d.guidelinesLead + "\n" + K.bullets(d.guidelines)
          + "\n\n" + d.whileLead + "\n" + K.bullets(d.whileMoving), null, { conditions: true }) : null,
        // Cinematic Momentum, the Toolkit's own heading, Admin only (no GM label; batches 44 to 50)
        cm && admin(ctx) ? K.ruleBlock(cm.name, cm.text) : null,
        K.seeAlso("Squeezing and occupied spaces:", [["ref-size/tight-geometry", "Tight Geometry"], ["ref-size/moving-through-an-occupied-space", "Moving Through an Occupied Space"]]),
        K.seeAlso("Speed itself:", [["bx-space", "Space, Speed & Area"], ["ref-actions/move", "Move"]]),
        K.seeAlso("Hauls and their Load states:", [["sk-load/hauls", "Hauls"]])
      ];
    } },

    /* ---- 2 · Jumping ----------------------------------------------------------- */
    { id: "mv-jump", title: "Jumping", tag: "LONG · HIGH · STANDING", order: 14, when: has("jumping"), build: function (ctx, K) {
      var j = M().jumping;
      return [
        K.proseBlock(j.intro),
        K.ruleBlock("Jump Distance", j.distance + "\n\n" + j.runUp),
        K.entry("jump-table", "Jump Table", [
          K.subTitle("Jump Table"),
          K.refTable(["Body or Agility Modifier", "Long Jump", "High Jump", "Standing Start"], j.table.map(function (r) {
            return [r.mod, String(r.long), String(r.high), r.standing];
          }), [0])
        ]),
        K.ruleBlock("Jump Cost", j.cost),
        K.ruleBlock(j.farther.name, j.farther.text, null, { terms: FFM }),
        K.ruleBlock(j.landing.name, j.landing.text, null, { conditions: true }),
        K.ruleBlock(j.doubling.name, j.doubling.text)
      ];
    } },

    /* ---- 3 · Falling & Forced Movement ------------------------------------------ */
    { id: "mv-fall", title: "Falling & Forced Movement", tag: "1d6 PER SPACE · 1d6 PER 2 FALLEN", order: 16, when: has("fallingForced"), build: function (ctx, K) {
      var m = M(), kb = m.kineticBox;
      return [
        K.ruleBlock("Falling & Forced Movement", m.fallingForced),
        // the book's box title is "Forced Movement"; it sits in Kinetic Resonance, so the heading says so
        kb ? K.ruleBlock("Kinetic " + kb.name, kb.text) : null,
        K.seeAlso("Moving a Target yourself:", [["mv-maneuvers/shove", "Shove"]]),
        K.seeAlso("Forced movement never provokes:", [["ref-actions/opportunity-attacks", "Opportunity Attacks"]]),
        K.seeAlso("Where they land:", [["ref-conds/prone", "Prone"], ["ref-hazards", "Environmental Hazards"]])
      ];
    } },

    /* ---- 3b · the Optional Damage Effects that move a Target: the GM's now ---------
       The Appendix: Optional Damage Effects lives in the Game Master's Toolkit (the Handbook
       now prints "Some tables add optional damage Effects (Ignite, Bleed, Mutating, Reversal,
       and the rest); your GM will say if yours does.", EN.combat.optionalEffectsNote, shown in
       Damage Types on both desktops), so these two render on the Admin desktop only. */
    { id: "mv-optfx", title: "Optional Damage Effects That Move a Target", tag: "CONCUSSIVE · KNOCKBACK", audience: "gm", order: 17,
      when: function () { return movingRows().length > 0; }, build: function (ctx, K) {
      var d = fxData(), rows = movingRows();
      if (!rows.length) return [];
      return [
        d.intro ? K.note(d.intro) : null,
        rows.map(function (e) {
          return K.ruleBlock(e.name, e.text, e.type.toUpperCase() + " · " + groupName(d, e).toUpperCase(), { conditions: true });
        }),
        K.seeAlso("The whole appendix:", [["gmt-damage-effects", "Optional Damage Effects"]]),
        K.seeAlso("The movement itself:", [["mv-fall", "Falling & Forced Movement"]])
      ];
    } },

    /* ---- 4 · the three maneuvers ------------------------------------------------- */
    { id: "mv-maneuvers", title: "Shove, Trip & Grapple", tag: "ACTIONS · CONTESTS", order: 18, when: has("maneuvers"), build: function (ctx, K) {
      var mv = M().maneuvers, held = mv.heldTarget;
      return [
        K.proseBlock(mv.intro),
        mv.list.map(function (x) {
          return K.ruleBlock(x.name, x.lead + "\n" + K.bullets(x.points), "ACTION", { conditions: true });
        }),
        held ? K.ruleBlock(held.name, held.text, null, { terms: { "People as Improvised Weapons": "ref-improvised/people-as-improvised-weapons" } }) : null,
        K.seeAlso("Size limits:", [["ref-size/shove-trip-and-grapple", "Shove, Trip and Grapple"], ["ref-size/the-body-gate", "The Body Gate"]]),
        K.seeAlso("Where a shove ends:", [["mv-fall", "Falling & Forced Movement"]])
      ];
    } },

    /* ---- 5 · Wall-to-Wall ---------------------------------------------------------- */
    { id: "mv-wall", title: "Wall-to-Wall", tag: "EXPLOSIVES INDOORS", order: 35, when: has("wallToWall"), build: function (ctx, K) {
      var w = M().wallToWall;
      return [
        K.proseBlock(w.intro),
        w.parts.map(function (p) { return K.ruleBlock(p.name, p.text); }),
        K.seeAlso("Cover against a blast:", [["ref-cover/cover-and-defense", "Cover and Defense"]]),
        K.seeAlso("The traits:", [["gr-traits/explosive", "Explosive"], ["gr-traits/pressure", "Pressure"]])
      ];
    } }
  ]);

  /* Pointer terms: the names the book, the class text and the gear text use for these
     rules. Panel titles ("Jumping", "Wall-to-Wall", "Shove, Trip & Grapple") link on their
     own, "Falling & Forced Movement" among them (see FFM above). "Concussive" is
     not a term: the Force damage type's own text uses the word for something else. */
  CV.terms({
    "Difficult Terrain": "mv-move/difficult-terrain",
    "Through a Body": "mv-move/through-a-body",
    "Speed reductions": "mv-move/speed-reductions",
    "Cinematic Momentum": "mv-move/cinematic-momentum",
    "Dragging, Pushing, and Pulling": "mv-move/dragging-pushing-and-pulling",
    "jump distance": "mv-jump/jump-distance",
    "long jump": "mv-jump/jump-distance",
    "high jump": "mv-jump/jump-distance",
    "forced movement": "mv-fall",
    "forcibly moved": "mv-fall",
    "Knockback": "mv-optfx/knockback",
    "Shove": "mv-maneuvers/shove",
    "Trip": "mv-maneuvers/trip",
    "Grapple": "mv-maneuvers/grapple",
    "Attacks and Maneuvers": "mv-maneuvers",
    "Rebound": "mv-wall/rebound"
  });
})();
