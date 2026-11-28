/* ===========================================================================
   ELYSIUM NIGHTS · Quick-Start job: The Fifth Flavor  (EN1003)
   The Game Master section of the Quick-Start Rules (playtest draft
   2026-11-28A): RUN / THE JOB (Game Master Only, The Fifth Flavor, Scenes 1
   to 5, The Night Shift) and RUN / THE TABLE (Running It Solo, The GM's
   Card). The Threats page is not here: its statblocks are
   data/quickstart_threats.js, in the Bestiary. js/codex_quickstart.js draws
   this as the Admin Codex chapter "The Fifth Flavor" while
   EN.launch.quickstart() is on; nothing else reads it.

   THE WORDING IS THE BOOKLET'S: line breaks rejoined, ligatures spelled out,
   page furniture (running heads, folios, CONTENTS, INDEX) dropped, and the
   Glimmer glyph set tight to its number the way data/gm_payroll.js prints it
   ("𝒢1,800"). Every number, DC, die, range, duration, XP and pay figure is
   as printed. The few places the words changed, all for the app:
     - page references are gone: "(Threats, page 45)" becomes the threat's
       name (the chapter links it to its Bestiary entry), "the Dispatch lines
       on page 36" reads "in Scene 3", "the route (page 39)" reads "(Scene 4)";
     - "Everything past this page spoils the job" reads "in this chapter",
       and "the five Freelancers in this booklet" reads "the five Quick-Start
       Freelancers";
     - the two floor plans (Scene 2's pump house, Scene 3's plant) are images
       the app cannot carry: their captions stay, with a note that the map is
       in the booklet;
     - the GM's Card's one-line Freelancer stats are a table here.
   Bold run-ins are marked **...** (EN.ui.applyInline, via the Codex kit).

   SHAPE
     EN.quickstart.job = { schemaVersion, key, title, book, sections: [section] }
     section  { key, title, tag, blocks: [block] }   one Codex panel each, in
              order; the panel id is "qs-" + key
     block    one of, in page order:
       { kind: "prose", text }          paragraphs, one per line; a line that
                                        starts "- " is a bullet
       { kind: "aloud", name?, text, tag? }   the boxed read-aloud text, an
                                        addressable entry, printed as is
       { kind: "rule", name, text, tag?, slug? }   a named block (an entry)
       { kind: "section", name, text, aloud?, handout?, after?, slug? }
                                        an entry under a heading: prose, then
                                        an optional read-aloud box, an optional
                                        handout, and more prose
       { kind: "card", name, slug?, print?, aside?, tag?, lines: [[label, text]],
         text? }                        a person: the contact-card lines, then
                                        prose (Work, Want, Fear, Resolve, Their
                                        Profile of You, Tell, as printed)
       { kind: "table", name, slug?, lead?, columns, rows, strong?, after?,
         plain? }                       a printed table; `plain` true for an
                                        in-world handout (no rule links)
       { kind: "handout", name, lead?, lines }   in-world text, kept line for line
       { kind: "sub", name }            a heading with no entry of its own
       { kind: "note", text }           a small italic line
       { kind: "map", text }            a floor plan's caption
       { kind: "threats", lead?, names }  the threats a passage sends to the
                                        Threats page, by their Bestiary names
                                        (data/quickstart_threats.js)
   No em or en dashes anywhere in this file (house style).
   =========================================================================== */
window.EN = window.EN || {};
EN.quickstart = EN.quickstart || {};

EN.quickstart.job = {
  schemaVersion: 1,
  key: "fifth-flavor",
  title: "The Fifth Flavor",
  book: "EN1003",

  sections: [

    /* ---- GAME MASTER ONLY, THE FIFTH FLAVOR --------------------------------- */
    { key: "overview", title: "The Fifth Flavor", tag: "GAME MASTER ONLY · ONE SESSION · FIVE SCENES", blocks: [
      { kind: "rule", name: "Game Master Only", tag: "SPOILERS",
        text: "Players, stop here. Everything in this chapter spoils the job. GM, read The Fifth Flavor before the session." },
      { kind: "prose", text:
        "Fullwell sells its vat-protein cubes under the Lonely Mouth label, in four flavors. They all taste like the fifth one. Nobody outside the company has ever named the fifth, and someone with money has decided they'd like the recipe.\n" +
        "The crew is hired to copy the formula off a server in Fullwell's Synth Flats bottling plant and get out without anyone seeing their faces. The formula turns out to be mostly salt and a patent number. The interesting part is the water the cubes are grown in, and where it's pumped from.\n" +
        "Run it for a crew of two to four, picked from the five Quick-Start Freelancers. One player and a GM can run it too, with Running It Solo at the end of the job." },
      { kind: "rule", name: "At a Glance", text:
        "**Crew:** Two to four Caliber 1 Freelancers, picked from the five Quick-Start Freelancers. See Scaling. One player and a GM can run it with Running It Solo.\n" +
        "**Length:** One session, about four hours of play, five scenes.\n" +
        "**Where:** The Crossing Bowl, a noodle bar in Ferrymark. Then Sumpside: Synth Flats, the Sump Rats' pump house, and the stilt lanes of Hollow Bend.\n" +
        "**Pay:** A Hard Contract: 𝒢2,400 posted, 𝒢1,800 for the crew after the Exchange's cut.\n" +
        "**Milestone:** Completing it is a Major Milestone.\n" +
        "**Teaches:** Legwork on Dice Pools, Friction, a Sit-Down, a wired site, one fight with a response clock, a foot chase on the Lead track." },
      { kind: "section", name: "The Shape of It", text:
        "Scene 1, The Desk, is Legwork: the posting, the terms, and the threads. Scene 2, The Pump House, finishes the Legwork and becomes the Plan. Scene 3, The Plant, and Scene 4, Out the Back, are Execution. Scene 5, Payday, is Fallout. There's one complication, and it waits until the end.\n" +
        "Four things keep a table on the rails, and each is waiting in its scene:\n" +
        "- **The tunnel only runs one way.** The plant draws its intake at half past two, and the tunnel floods behind the crew. In is easy. Out is the back door.\n" +
        "- **The line has people on it.** Two line workers run the bottling floor all night. They're witnesses, not threats.\n" +
        "- **The monitors have a room.** The security booth over the loading dock, where Tomasz Quill drinks his coffee.\n" +
        "- **Payday has an address.** The noodle stand on stilts at the end of Hollow Bend." },
      { kind: "table", name: "Scaling",
        lead: "The job is written for four. Every fight is priced from the Encounter Budget: at Caliber 1, a Fair Fight is 100 XP per Freelancer and a Milk Run is half that. A smaller crew faces fewer people, not weaker ones.",
        columns: ["Crew", "If It Goes Sideways (Scene 2)", "The Night Shift (Scene 3)", "Capture at Lead 0 (Scene 4)"],
        rows: [
          ["Four", "Six Sump Rat Pump Crew: 150", "Quill, four Riot Troopers, the Spotter Drone: 375 of 400", "Doan and Pryce: 300"],
          ["Three", "Six Sump Rat Pump Crew: 150", "Quill, two Riot Troopers, the Spotter Drone: 275 of 300", "Doan and Pryce: 300"],
          ["Two", "Four Sump Rat Pump Crew: 100", "Quill and the Spotter Drone: 175 of 200", "Doan and Pryce: 300"]
        ], strong: [0],
        after:
        "The shifts thread's head count follows the night shift you run. Nothing else changes. Pay splits the same 𝒢1,800: 𝒢450 each for four, 𝒢600 for three, 𝒢900 for two. With two or three players, any crew can finish it: the lab has five ways to the file. Ledger makes it easiest.\n" +
        "**Five at the table.** The job is built for four, but nothing stops five. Give the night shift two more Riot Troopers (475 of 500), make it eight Sump Rat Pump Crew if it goes sideways (200), and leave Doan and Pryce as they are. The pay splits 𝒢360 each." }
    ] },

    /* ---- SCENE 1: THE DESK --------------------------------------------------- */
    { key: "desk", title: "Scene 1: The Desk", tag: "LEGWORK · ABOUT 40 MINUTES", blocks: [
      { kind: "prose", text:
        "Legwork. About 40 minutes.\n" +
        "Open with the posting on the table. It's on the Exchange's open board, so anyone rated can take it. Read it aloud, or hand it over. (If the table read Terms at the Desk, they've already been here. Start at the counter.)" },
      { kind: "aloud", name: "The Posting", tag: "READ IT OR HAND IT OVER", text:
        "OPEN POSTING, HAZARD CONTRACTORS' EXCHANGE. Data retrieval, private client. One file from a commercial server, Synth Flats. Rated Caliber 1 or better. No-Heat clause: nobody sees a face, nobody files a report. Twenty-four hundred Glimmer on delivery. The Exchange takes its cut. Terms with the desk." },
      { kind: "prose", text:
        "The Exchange's Ferrymark desk is a counter in a noodle bar with a claims printer bolted to the wall. The woman behind it reads every term aloud, slowly, and looks up after each one to make sure you heard it." },
      { kind: "aloud", text:
        "The Crossing Bowl sits at the bottom of a stair that used to be a street. Six stools, one counter, steam off a stockpot the size of a bathtub. Above the pot, bolted into the tile, the Exchange's claims printer chatters every few minutes and spits out a curl of paper that nobody reads. Behind the counter, on the noodle side, a cook. Behind the counter, on the other side, a woman with reading glasses on a chain, a stack of terms sheets, and a mug that says WORLD'S OKAYEST AUNT." },
      { kind: "prose", text:
        "**The printer.** Every time a posting on the board closes, it prints the closing stub. If the crew takes too long deciding, it prints one while they watch. Odette tears it off, reads it, and files it under the counter without comment.\n" +
        "**The cook.** Doesn't talk to Freelancers. Feeds them anyway. A bowl is 𝒢4, and if someone pays for the whole crew, Odette notices.\n" +
        "**The other stool.** A Ferryman eating alone at the end of the counter, salt in the creases, listening to everything. He takes nothing from this scene. He remembers it. Use him later." },
      { kind: "card", name: "Odette Delaune, \"Fine Print\"", slug: "odette-delaune", tag: "RESOLVE 5",
        print: "Odette Delaune-Abara, a marriage that lasted a fiscal quarter",
        lines: [
          ["Work", "Exchange desk agent, Ferrymark."],
          ["Want", "A crew that doesn't come back with a lawsuit stapled to it."],
          ["Fear", "Her name on a posting that turns into a Heat event."],
          ["Resolve", "5 (Standard)."],
          ["Their Profile of You", "Desperate. She's seen your rating. She's seen your bank balance."],
          ["Tell", "Taps the counter once per clause. Twice means the clause is going to hurt."]
        ],
        text:
        "Precise, unhurried, kind in a way that costs her nothing. A few lines to start from:\n" +
        "- **On the cut, before anyone asks:** \"None of you hold a card, so the Exchange takes the top cut. Twenty-five. That's not me. That's the building.\"\n" +
        "- **Why so much for Caliber 1?** \"Because the job is easy and the clause isn't. Getting in is a Tuesday. Getting out without a face on a camera is the part they're paying for.\"\n" +
        "- **If anyone pushes the cut:** \"The cut isn't a negotiation. It's weather. You don't haggle with rain.\"\n" +
        "- **Signing off:** \"Bring me the file. Bring me nothing else. Especially not a lawyer.\"" },
      { kind: "section", name: "The Terms", text:
        "Odette gives them straight. The client is private, and she doesn't know who it is. The file is \"the fifth flavor,\" a formula on a server in Fullwell's bottling plant. The no-Heat clause is real: if Fullwell can name the crew, the client walks and nobody gets paid. The job is tomorrow night. That leaves a day for legwork, and puts the crew at the plant for its 2 a.m. shift change.\n" +
        "Nobody in the crew holds an Exchange card, so the job comes at the Exchange's top cut, 25 percent: 𝒢600 to the Exchange and 𝒢1,800 for the crew. A crew that wants a better number can try. Run it as Friction: Persuasion or Intimidation against Moderate risk (2 Snag Dice).\n" +
        "- **Costly Success or better:** she writes 𝒢2,600 by hand and initials it, which is 𝒢1,950 for the crew. \"That's the ceiling. Don't come back with a lower floor.\"\n" +
        "- **Mixed Result:** 𝒢2,600, and her Profile of the crew becomes Pushy.\n" +
        "- **Failure:** the number stays where it is, and so does the look.\n" +
        "She won't budge on the cut.\n" +
        "**GM Guidance:** On its own this is a Fair Fight job, worth 𝒢500 to 1,000 at Caliber 1. The no-Heat clause moves it one column right, to a Hard Contract. That's why it pays what it pays." },
      { kind: "table", name: "What Legwork Turns Up",
        lead: "Before they go anywhere near the plant, let each Freelancer pick one thread and work it however fits. Every thread has a face. Each is a Dice Pool against Moderate risk (2 Snag Dice), or DC 15 if someone insists on doing it in a hurry. A success gets the thread. A Mixed Result gets it, and somebody remembers who was asking. A clean success (a Pool Margin of +3 or more, or a d20 Margin of +5 or more) gets the extra line too.",
        columns: ["Thread", "What It Turns Up", "Who to Ask", "Where, and the Price"],
        rows: [
          ["The building", "The plant's public layout: loading dock, staff stair on the east side, bottling floor, a QA lab on the second floor. Clean success: the lab's server is the only thing up there with its own firewall, and the QA manager, Dr. Sorel, sets her PIN to the batch on the reference retain. Every lab does that. Every lab gets told not to.",
            "Cassia Moor, a laid-off QA tech, fired for asking where the test water came from", "Phone repair stall, South Sprawl market. A drink, or her stall fee for a week (𝒢30)."],
          ["The shifts", "Night shift is thin: one Corpsec officer, four guards in riot kit, and a drone that does laps. Shift change is at 2 a.m., and for ten minutes the monitors sit empty. Clean success: the drone docks to charge at 2:05 for four minutes. A crew that knows this can cross the floor in that window with no Spotter Drone in play.",
            "Restock (formal: LMB Route Unit 7), a Clanker vending-route unit nobody has ever asked how its night is going", "The Lonely Mouth vending route. A conversation that isn't about vending."],
          ["The water", "Fullwell doesn't truck water in. It pumps it from under Sumpside, through intakes the Sump Rats used to run before the plant bought the rights.",
            "Nalo Fenwick, Small Altars keeper", "Shrine shelf above a Hollow Bend laundromat. A coin in the box and a name said for the block."],
          ["The way in", "The Sump Rats still hold pump keys that fit half the stations in Sumpside. One of those stations feeds the plant's intake. The tunnel comes up under the bottling floor. Clean success: the Sump Rats watched the yard from the FULLWELL sign during the pickets two springs ago, and the sign has a ladder.",
            "Kettle, Sump Rat lookout with a bad knee", "The noodle stand at the end of Hollow Bend. Buying the second bowl, which is free anyway."]
        ], strong: [0],
        after:
        "Gantry's Flashing the Tin gets the shifts thread without a roll. A crew that drops a coin in Nalo's box and says the block's name gets a name said back, a person's, with no explanation. It's the name Undertow's grove used, and saying it at the pump house flips Their Turf to neutral. Restock's parting line, whatever the roll: \"If you see machine twelve in the break room, tell it I said hello. It doesn't talk back. I keep trying.\"\n" +
        "If the crew misses the way in, Odette mentions it on the way out. Tap, tap. \"That plant doesn't truck its water in. It drinks from under Sumpside. The people who used to run those pumps still have keys. I'd want to know them before I wanted to know the guards.\"" },
      { kind: "sub", name: "The Faces" },
      { kind: "prose", text:
        "Every thread has a face, and every face wants something small. Give it to them and the thread comes easier. On a Mixed Result, this is who remembers being asked, and what they do with it." },
      { kind: "card", name: "Cassia Moor", tag: "THE BUILDING", lines: [
          ["Want", "someone to say out loud that she was right about the water."],
          ["Tell", "fixes your phone across the counter while you talk, whether it's broken or not. \"You didn't come for a screen. Not at this hour.\" \"They fired me for a question. Tells you which questions they've got answers to.\" \"I ran their water tests for six years. You know what I never saw? The water.\""],
          ["Mixed Result", "she calls the one friend still on Fullwell's day shift, to brag that somebody finally listened. Nothing happens tonight. In the morning Dr. Sorel finds a sticky note on her monitor: SOMEBODY ASKED ABOUT THE WATER."]
        ] },
      { kind: "card", name: "Restock", tag: "THE SHIFTS", lines: [
          ["Want", "one conversation a night that isn't about stock levels."],
          ["Tell", "refills whichever machine you're standing beside, one can at a time, so the talk lasts longer. \"Lonely Mouth Route Unit 7. Restock, if you like. Nobody has ever asked if I like.\" \"The night shift buys coffee, protein bars, and the yellow one.\" \"I have a route log. Would you like to be in it? Nobody is ever in it.\""],
          ["Mixed Result", "it logs the whole conversation, because it logs everything. Lonely Mouth reads the route logs once a quarter. Restock's hasn't been opened in two years. Restock knows."]
        ] },
      { kind: "card", name: "Nalo Fenwick", tag: "THE WATER", lines: [
          ["Want", "the block's name said out loud, every night, by somebody new."],
          ["Tell", "lights a candle on the shrine shelf before every answer, and blows it out after. \"Coin's for the block. Talk's free.\" \"Water remembers whose it was. So does the shelf.\" \"You want the plant. Everybody up there wants something downhill.\""],
          ["Mixed Result", "Nalo says the asker's name for the block too, out loud, to the whole laundromat. By the time the crew reaches the pump house, the card players at the drum already know it."]
        ] },
      { kind: "card", name: "Kettle", tag: "THE WAY IN", lines: [
          ["Want", "the second bowl eaten, and no questions about the knee."],
          ["Tell", "rubs the knee when lying, and when telling the truth about something that hurt. \"Sit. The second bowl's free. Everybody knows. Nobody comes.\" \"Half the stations down here still open to our keys. Fullwell never changed the locks. Cheaper not to.\" \"Undertow will hear you out. Undertow hears everybody out. That's the dangerous part.\""],
          ["Mixed Result", "Kettle limps out to the pump house ahead of the crew. Undertow knows what they want before they ask, and opens with it."]
        ] }
    ] },

    /* ---- SCENE 2: THE PUMP HOUSE --------------------------------------------- */
    { key: "pumphouse", title: "Scene 2: The Pump House", tag: "LEGWORK INTO PLAN · A SIT-DOWN FOR A PUMP KEY", blocks: [
      { kind: "prose", text:
        "Legwork into Plan. About 40 minutes. A Sit-Down for a pump key.\n" +
        "The Sump Rats' pump house sits on stilts at the edge of Hollow Bend, humming. The floor is wet. It is always wet. A dozen Sump Rats in waders are playing cards on an upturned cable drum, and none of them stand up. Their boss sits on the main valve housing like it's a throne, because to them it is one." },
      { kind: "aloud", text:
        "You hear it before you see it. A thump every four seconds, deep enough to feel in your back teeth. The pump house stands on twelve stilts at the edge of the Bend, a corrugated shed the size of a chapel, lit from inside by work lamps strung on wire. A gangway runs out to it from the last dry street. The boards are wet. The door is open. Inside, a dozen people in waders are playing cards on a cable drum, tossing brass washers into an upturned hard hat. At the far end, on the housing of a valve wheel as wide as a car tire, someone is sitting with their legs crossed, watching the gauges and not you." },
      { kind: "section", name: "Hollow Bend Pump Station 4", text:
        "Floor plan: Pump Station 4. One square is one space. The gangway runs off the map, 40 meters south to the last dry street. Letters match the key.\n" +
        "- **G, The gangway.** Forty meters of slick plank on stilts. Two Sump Rats lounge at the shore end. They let anyone walk out. They decide who walks back.\n" +
        "- **C, The cable drum.** The card table. The game is called Low Water and nobody will explain the rules. A Freelancer who sits down and loses a hand gracefully makes a friend. One who wins makes a story.\n" +
        "- **T, The throne.** The main valve housing, rust-red, with Undertow on top of it. Behind it runs the pipe to Fullwell's plant, newer than everything else in the room and stenciled CLEARLINE in clean white paint. Clearline is Fullwell's water company: the pumps, the filtration, the pipes.\n" +
        "- **W, The gauge wall.** Twenty pressure dials and a column of hand-painted flood lines going up the wall, each with a date. The highest is chest-height. The newest is two months old.\n" +
        "- **K, The key board.** A pegboard by the door with forty-odd pump keys on hooks, each tagged with a station name in marker. One hook is empty. Its tag says FULLWELL INTAKE. Undertow wears that key on a cord.\n" +
        "- **H, The hatch.** A steel floor hatch near the throne, Fullwell's padlock on top of an older Sump Rat one. It opens onto the intake line." },
      { kind: "map", text: "The pump house floor plan is printed in the booklet." },
      { kind: "rule", name: "The Midnight Cycle", text:
        "The pump cycles four Rounds into the Sit-Down, or at the first loud act in the room. The thump becomes a roar, the floor drains backward, and the room fills to the knee in about a minute. Anyone on the open floor makes an Agility Save (DC 13) or goes Prone in the water, in front of everyone. After the surge, the floor is Difficult Terrain for anyone without Home Ground, and Time Pressure is live for the crew. The counter is getting up on the cable drum, the gangway rail, or the throne's step first.\n" +
        "A crew that watched the gauge wall (a free Read, Wits DC 13) sees it coming one Round early. The Sump Rats don't move. They lift their cards off the drum, wait, and keep playing." },
      { kind: "card", name: "Undertow", slug: "undertow", tag: "RESOLVE 5",
        aside: "Undertow of the Quiet Sump (Verdine; the grove was a wellhead Clearline capped)",
        lines: [
          ["Work", "Runs the Sump Rats' pump crew out of the Hollow Bend pump house."],
          ["Want", "Proof that Fullwell is growing its cubes in Sumpside's water and selling them back to Sumpside."],
          ["Fear", "Another lawyer with a nice voice."],
          ["Resolve", "5 (Standard)."],
          ["Their Profile of You", "Bought. Anybody asking about the plant is working for someone."],
          ["Tell", "Opens and closes a valve wheel while listening, a quarter turn each way, never more."]
        ],
        text:
        "Old for a Sump Rat, with leaves that grew in pale from years without sun. Undertow speaks slowly, never louder than the pump. They aren't hostile. They're tired of being lied to, and curious whether this crew will bother.\n" +
        "- **Opening, not standing up:** \"You came out on my gangway at night to ask me something. Ask it. The pump's going to cycle soon and I'd hate for you to get your shoes wet before you get to the point.\"\n" +
        "- **Stonewall, from someone wearing the key:** \"Plant? There's a lot of plants in Synth Flats.\" \"We don't run those intakes. Haven't for ten years. There's a padlock says so.\" \"I don't know anything about a tunnel. I've got a hatch. Hatches go down. Everybody knows that.\"\n" +
        "- **Counter, asking back:** \"Who's paying you?\" \"What's in the file? You don't know? Then why should I?\" \"When you're done robbing them, who drinks the water?\"" },
      { kind: "section", name: "How the Approaches Land", text:
        "- **Persuasion (double Pressure).** Saying plainly that the crew wants to hurt Fullwell, or wants to know what's in the water, works. The quarter turns slow down. \"Now that's a thing a person can say out loud.\"\n" +
        "- **Deception (no Pressure).** Undertow listens politely to the whole lie, then: \"That's good. Better than the last one. The last one had a briefcase.\" Two Sump Rats laugh without looking up.\n" +
        "- **Intimidation.** It moves Resolve, but every Sump Rat at the drum puts their cards face down. If it's the crew's second Intimidation in the scene, call it out: one more, and half the room stands up.\n" +
        "- **Performance.** A crew that sits down to Low Water and plays it straight earns one Pressure without a roll. Once.\n" +
        "- **A Read.** \"Undertow watches the gauges, not you. They care what the water's doing more than what you're paying.\" That's the weak spot, given up honestly.\n" +
        "- **The name from Nalo.** Undertow goes still. The valve wheel stops mid-turn. \"Where'd you hear that?\" Their Turf flips to neutral, and Undertow answers the next question straight, whether it moved Resolve or not.\n" +
        "**On the grove:** \"There was a grove down there. Mine. It grew on the wellhead, the way we do when the city leaves us alone long enough. Clearline capped it for 'contamination.' Then they built a plant downhill and started pumping from right next to the cap.\" A quarter turn. \"Contaminated water makes very good cubes, apparently.\"" },
      { kind: "section", name: "The Sit-Down, Filled In", text:
        "- **Stakes.** The crew wants a pump key and the tunnel route into the plant. Undertow wants what's on the server, or something close to it. At Resolve 0, Undertow hands over the key and sends a runner to show them the tunnel, for nothing but a copy of whatever they find. Before that, the offer is the key alone for 𝒢400, and they find the tunnel themselves.\n" +
        "- **Opposition.** Undertow, Resolve 5 (Standard). Profile of the crew: Bought.\n" +
        "- **Weak spots.** Persuasion deals double: the crew and the Sump Rats both want to hurt Fullwell, and saying so plainly works. Deception deals none: the Sump Rats have been lied to by better-paid people for ten years.\n" +
        "- **Postures.** Leans on Stonewall and Counter. Once Cornered, only Deflect or Compose.\n" +
        "- **The Floor.** Their Turf: Snag for the crew. A Freelancer whose home district is Sumpside, named before play, makes it neutral, because somebody at the cable drum knows their aunt. Time Pressure: the crew has a 2 a.m. shift change to make, so it's Snag for the crew once the water comes in.\n" +
        "- **The clock in the room.** A Round is a few minutes. After four Rounds the pump cycles. Undertow doesn't move. Undertow enjoys this part." },
      { kind: "table", name: "Where It Lands",
        columns: ["Where It Lands", "What Undertow Says and Does"],
        rows: [
          ["Resolve 3", "\"Four hundred and you get the key. Find the tunnel yourself. It's not hard. Follow the smell of syrup.\""],
          ["Resolve 1", "\"You'd give us a copy? Of whatever's in there? Even if it's nothing?\""],
          ["Resolve 0", "Undertow lifts the key off their neck and holds it out. \"Silt walks you down. You bring me a copy of whatever you find. If it's salt and a patent number, fine. I'll frame it.\" The key, the tunnel, Silt, and Undertow's Profile of the crew becomes Useful."],
          ["Mixed Result", "Undertow picks from the Social Fallout menu. The likely pick is worse terms: \"Two hundred and a copy. And if you get caught, you never stood on my gangway.\" Those terms stand only if the crew takes the deal. Break Undertow to Resolve 0 afterward and they're gone."],
          ["First Critical Failure", "The usual: Undertow gains 1 Resolve and the Freelancer takes strong Social Fallout. The valve wheel stops. \"Careful.\" Nobody at the drum deals the next hand."],
          ["Second Critical Failure", "Undertow just nods. \"Go on, then. Find another way.\" On the gangway back, one of the card players is already on a phone, and doesn't bother to turn away. That card player is working alone, and has sold the crew's description to the plant's night officer: the Spotter Drone is waiting at the tunnel mouth, and the response clock starts the moment it sees them."]
        ], strong: [0] },
      { kind: "section", name: "If It Goes Sideways", text:
        "If the crew pulls weapons, half the room stands up: six Sump Rat Pump Crew (four, against a crew of two) on their own turf, where the water doesn't slow them. It's a Milk Run and a bad start. Undertow doesn't get up. Their block is in the Bestiary too (Undertow of the Quiet Sump), for a crew that goes for the valve housing anyway. The crew can still win it, but the tunnel stays shut, and they're going in through the staff door. Let them." },
      { kind: "threats", names: ["Sump Rat Pump Crew", "Undertow of the Quiet Sump"] },
      { kind: "section", name: "Silt, the Runner", text:
        "Human, Resolve 3 (Pushover). The youngest Sump Rat at the drum: quick, wiry, and very proud of knowing the tunnel in the dark. Silt walks the crew down only if Undertow breaks at Resolve 0. On anything else, they're on their own.\n" +
        "- **On the hatch:** \"Fullwell's lock is on top. Ours is underneath. Theirs is the one that's for show.\"\n" +
        "- **On the way down:** \"Don't touch the pipe. It's not hot. It's just theirs.\"\n" +
        "- **Passing the cap:** \"That's Undertow's. Was. Don't say anything about it upstairs.\"\n" +
        "- **At the grate:** \"Half two, the plant drinks. Don't be in here then. I won't be.\"\n" +
        "- **If the crew is friendly at the end:** \"If you come out the back and it's bad, run downhill. Stilt lanes. Gate's at the end of Pell Street. I'll be on it.\" That's the escape gate in Scene 4." },
      { kind: "section", name: "The Intake Tunnel",
        aloud: "Under the hatch, an iron ladder goes down into a culvert taller than you are. The Clearline pipe runs along one wall, fat and smooth and cold. A maintenance catwalk runs along the other, rusted to lace in places. Water moves in the channel between them, ankle deep, in no hurry. After a few hundred meters you start to smell it: sugar and salt and something under both, like a kitchen that never gets cleaned.",
        after:
        "The walk is about eight hundred meters and twenty minutes. Three things on the way:\n" +
        "1. **The catwalk.** Average material (Structure 9, Integrity 12), a meter above the channel. It groans at every step and holds unless someone Dashes or fights on it. The channel is Difficult Terrain, but nobody's chasing them yet.\n" +
        "2. **The cap.** Halfway, the culvert opens into a round chamber. In the center, a concrete cap a meter thick, stamped CLEARLINE and a date eleven years old. Around it, on every flat surface: pressed leaves, small jars of water with handwritten labels, a pair of reading glasses, a child's drawing of a tree. The Clearline intake drops through the floor into the old well shaft, right beside the cap. A Verdine feels the current here run thin and sour. Anyone who looks at the two together understands it. Whoever walks past, the water in the jars leans toward the cap, a finger's width off level, against the current in the channel. Nobody is touching them. If Sunday's at the table, give the player the moment.\n" +
        "3. **The grate.** The tunnel ends under a steel drain grate. Blue light through the bars. The thump of the line. Syrup drips on whoever looks up first. The grate lifts with an Easy Athletics check (1 Snag Die) or DC 10, or with Silt's pry bar, quietly." },
      { kind: "rule", name: "The Draw", tag: "2:30 TO 2:36", text:
        "At half past two the plant pulls its night intake, and for six minutes the tunnel runs uphill toward the plant. A line controller hacked to double speed pulls early. Anyone in the channel makes a Body Save (DC 13) at the end of each round or is carried 2 spaces toward the grate and the intake screens behind it. Carried into the screens is 2d6 Bludgeoning, and dropped items are gone. Heading out, the tunnel is impassable from half past two, and the culvert runs full behind it until morning. Out is the back door, which is what the job expects." }
    ] },

    /* ---- SCENE 3: THE PLANT (the site, minute by minute and room by room) ----- */
    { key: "plant", title: "Scene 3: The Plant", tag: "EXECUTION · ABOUT 90 MINUTES · GRADE 2, WORKING", blocks: [
      { kind: "prose", text:
        "Execution. About 90 minutes. A wired site, a night shift, and a response clock.\n" +
        "Fullwell Bottling (Flats Bottling on every form) is a long low box of corrugated steel with its name lit in four colors. Inside, the line never stops: vat slurry in, cubes out, pressed in four colors under blue light and boxed beside the bottled water, all of it marching off to be sold back to the people who live downhill. The site is a Grade 2 plant with a Working response tier." },
      { kind: "aloud", text:
        "The bottling floor is one long room under blue light, loud as hail on a tin roof. Four short, waist-high lines run side by side down the middle. Overhead, a supply pipe from steel vats at the far end feeds grey slurry into the presses at the head of each line. Every three seconds, each press slams down and lifts on a slab in its own color: orange, green, red, a yellow nobody has ever liked. The slabs ride on through cook, cut, and wrap, come out as cubes, and drop into the boxer. The boxes march off into pallets of product stacked two stories high. A steel crossover spans all four lines halfway down. The air smells like sugar and salt, and the floor is tacky underfoot. Somewhere in the noise, someone is whistling." },
      { kind: "table", name: "The Night, Minute by Minute",
        lead: "Give the players this timeline if their legwork earned it, and let them build the plan on it.",
        columns: ["Time", "What Happens", "Who Knows It"],
        rows: [
          ["1:40", "Quill takes his black coffee in the security booth", "Restock"],
          ["2:00", "Shift change. The whole night shift swipes the time clock by the staff door. The monitors are empty for ten minutes", "Restock; the shifts thread; the corkboard"],
          ["2:05", "The Spotter Drone docks to charge in the booth for four minutes. It lifts off again at 2:09", "Restock, on a clean success"],
          ["2:10", "The Standby trooper takes the monitors. Quill starts his first walk", "Anyone watching the booth"],
          ["2:20", "Jerry lifts a pallet of cartons through the pallet gate to the mezzanine", "Anyone watching the floor"],
          ["2:25", "Quill is back in the booth", "Anyone watching the booth"],
          ["2:30", "The Draw. The intake tunnel floods toward the plant, and the pumps roar at the north end for six minutes", "Kettle, Silt"]
        ], strong: [0],
        after:
        "The ten minutes from 2:00 are the window everything points at. From 2:05 to 2:09 the booth is empty, the drone is on its cradle, and every trooper is standing around the time clock. Marisol and Jerry are the only eyes on the floor.\n" +
        "The four troopers go by their radio call signs: Dock, Floor, Door, and Standby. A smaller night shift (Scaling) loses posts in this order: Standby, Floor, Dock, Door. Without Standby, nobody takes the monitors at 2:10, and the booth stays empty for Quill's whole walk. Three players face Dock and Door. A solo Freelancer faces Door, and Quill calls it from the booth. Two players face no troopers, so there are no radio checks. With five at the table, the two extra troopers double the Dock and Floor posts, and each pair answers the radio as one." },
      { kind: "section", name: "Fullwell Bottling, Room by Room", text:
        "One square is one space. North is up. The dotted magenta line is the drone's lap. Floor 2's south end is drawn under the ground floor, on the same grid, and the culvert runs dashed beneath. Locks and climbs use the usual ladder: Easy is 1 Snag Die or DC 10, Moderate is 2 or DC 15 under pressure.\n" +
        "Floor plan: the ground floor with the yard along its south wall, and floor 2's south end below it. Letters match the key." },
      { kind: "map", text: "The plant's floor plan is printed in the booklet." },

      { kind: "sub", name: "Ground Floor" },
      { kind: "rule", name: "T, Treatment and intake", text:
        "The raw water tank, two stories of steel. Filter skids, a UV skid humming blue, and the Clearline riser coming up through the floor. A yellow chem locker in the corner holds four drums of cleaning concentrate for the washdown bot (Salvage). The intake meter wears a brass plate, CLEARLINE INTAKE HB-4, and a maintenance tag: DATA TO QA SERVER, RACK R-3, LAB 2-01. A padlocked floor hatch opens onto the far side of the intake screens, which is why it's no way in from the culvert. It's empty. A photo of the meter plate is half the file: proof for Undertow even if the server job fails. The door's lamp lights on the booth's alarm board while it stands open, so close it behind you. From 2:30 to 2:36 the pumps run, and nothing done in here or in E is heard." },
      { kind: "rule", name: "E, Electrical room", text:
        "Motor control cabinets, the breaker panels, the sprinkler riser and its foam valve, and a manual foam release behind glass. An Easy lock. Every breaker is a lure: flip one, someone comes to look, and the crew picks where they look from. The floor lights drop the floor to red emergency light, and Quill sends the Floor trooper, about three minutes out. The line's breaker stops the presses, and Marisol radios it in. The yard lights bring the Dock trooper out with a flashlight.\n" +
        "The breaker schedule on the panel door is wrong in two places (Handout). Reading it right is Engineering at Moderate, or the players reading the card; the wrong breaker does the wrong thing. The manual foam release rings the fire bells, and the fire panel calls Dispatch on its own: the clock starts. Shut the foam valve, and the floor can't be foamed tonight, by the crew or anyone else." },
      { kind: "rule", name: "B, Bottling floor", text:
        "The fight happens here if it happens. The lines are Heavy cover, and so are the steel vats at the north end. Four short lines, one per flavor: a press at the head of each, then cook, cut, and wrap. A raised crossover spans all four over the cut stations, with stairs at each end. The dark bottled-water line runs along the west wall, with the main aisle between. Sprinkler heads (blue rings) are the fire suppression. It's loud: anything quieter than a gunshot is lost in the presses, so the crew can't be heard, and can't hear the drone coming. Say so when they walk in. Marisol and Jerry work the line, and the Floor trooper walks a six-minute loop. The water line is dark, waist high and cold: anyone moving along it has Edge on Stealth against anyone not standing in it. Its palletizer wakes when hacked, the same as the cube line's. A smock and a hairnet from H pass for line staff from twenty meters. Up close, Marisol knows her line, and it's a Deception check at Moderate." },
      { kind: "rule", name: "The washdown bot", text:
        "Fullwell's cleaning crew is one machine: a pressure lance on four wheels, a hose reel and a dosing pump, docked at its skid by the east wall. The wash it mixes is safe on skin at the dose and heat on its label. The dose and the heat are settings. At 3 a.m. it washes down all four lines whether they need it or not, so the shift hasn't touched it in years. Its Node is Standard [0], with no IC, and the only person who'd notice it misbehaving is asleep across town (The On-Call Tech). Hacked, it rolls where it's pointed and sprays what it's told (The Washdown)." },
      { kind: "rule", name: "The parts cage", text:
        "Chain-link, an Easy lock, and the spares that keep the line running: servo packs, sensor heads, belt motors, a box of drone rotors. A month of somebody's rent, counted every Monday (Salvage)." },
      { kind: "rule", name: "G, Drain grate", text:
        "Between the green and red presses, which is exactly where the line workers stand. The Sump Rats' tunnel comes up here. The grate lifts with an Easy Athletics check, or quietly with Silt's pry bar, and the crew comes up at Marisol's feet, inside the drone's lap. Back down is free before 2:30. After 2:30 it only runs one way (The Draw)." },
      { kind: "rule", name: "C, Line controller", text:
        "The console for the line's Node: a control desk on a raised step east of the boxer, facing up the lines. A screen, the line's E-stop, and a speed dial under a plastic flap with a sticker that says DON'T. Hack it from range for The Syrup Floor, or turn the dial by hand: no cipher needed, same result, under the lights in front of Marisol. The E-stop stops the presses. The floor goes quiet, the noise cover goes with it, and Marisol radios it in." },
      { kind: "rule", name: "The palletizer", text:
        "A yellow arm on a turntable south of the boxer. It lifts each box off the belt and builds the pallets Jerry carries to the stacks, three a minute, all night. Its Node is Standard [0], with no IC. Hacked, it swings or it builds (The Palletizer)." },
      { kind: "rule", name: "R, Drone", text:
        "The Spotter Drone, mid-lap. It laps the floor and the catwalk, about three minutes a lap, and charges in the booth." },
      { kind: "rule", name: "P, Pallet canyon", text:
        "Rows of shrink-wrapped product two stories high, with forklift lanes between them. Good for hiding, and a bad place to be when somebody starts shooting. The booth looks straight up the west lane; the east lanes are out of its view. The stack tops are a road. Climbing one is Athletics at Moderate (Easy with a leg up), and from the top the crew can walk to the catwalk rail or the lab's west glass. From the floor, the stack tops sit level with that glass. A failed climb drops a case of water two stories, and someone comes to look." },
      { kind: "rule", name: "The Underlings", text:
        "Three pairs of flat green pallet movers, sold in pairs and named by someone in marketing who thought it was cute. A pair slides under a pallet, one skate per fork pocket, lifts it a hand's width and carries it off, throwing blue warning spots on the floor ahead of them. They run pallets from the palletizer to the staging lanes and the dock, and charge against the west wall by the racks. They can't lift anything higher than a hand, which is the only reason Jerry still has a job. One fleet Node runs all three pairs: Standard [0], with no IC. Hacked, they carry what you say, where you say (The Underlings)." },
      { kind: "rule", name: "W, Warehouse, and L, the freight lift", text:
        "Racking along the west wall, full of last week's product: Average cover. The freight lift (L) is a caged platform from the dock floor to the mezzanine, at the head of the catwalk, ten spaces from the lab. After hours it runs on a key switch (a spare hangs in the booth; Quill carries one) or a hack. It rings a bell at each floor, loud enough to hear in the booth. Hacked, it goes quietly. Or pull the bell's wire from inside the cage: Engineering, Easy, a minute." },
      { kind: "rule", name: "D, Loading dock", text:
        "Three roll-up doors onto the yard, motorized from the booth, each with a manual chain hoist inside, and a personnel door. The dock camera on the inner wall covers the dock floor. It shows through the personnel door's wired window, so anyone who looks first sees it. The Dock trooper stands inside the personnel door, except from 2:00 to 2:10. The middle roll-up door stops a third of a meter short of the floor since a tanker backed into it. Nobody fits under it. Tinsel does." },
      { kind: "rule", name: "H, Hygiene room, and K, Lockers", text:
        "White smocks on hooks, boxes of hairnets and paper face masks, a boot bath, and a sanitizer turnstile that only turns after both palms rest on its pads for three seconds. It isn't a lock. It's a rule with a motor. Vaulting it is Acrobatics, Easy, and leaves wet boot prints for twenty meters unless someone steps on the mat. The masks are free face cover for the no-Heat clause. The lockers have cheap padlocks (Easy): the troopers' hold a spare radio on the contractor's channel and a spare jacket, and Marisol's holds a photo of two kids and a dog." },
      { kind: "rule", name: "V, Break room", text:
        "Off the floor by the east stair. A table, a microwave, a corkboard of safety notices, and two Lonely Mouth vending machines. The left one is machine twelve. Its purchase log names everyone on shift. The corkboard is the building's cheat sheet (Handout). A screen loops a two-minute food safety video hosted by the QA manager, Dr. Annika Sorel, who says \"reference retain\" four times. That's two minutes of her voice. The Standby trooper eats or sleeps here until 2:10." },
      { kind: "rule", name: "S, Staff door and east stair", text:
        "The door is a Standard Node. The staff door camera covers the approach. Inside, a vestibule with the time clock, the fire panel, and the Door trooper; from 2:00 to 2:10 the whole night shift stands right here. The stair is concrete and echoing, and the camera at the top has pointed at the ceiling since someone swung a ladder into it. Nobody fixed it. Nobody will." },

      { kind: "sub", name: "Below" },
      { kind: "rule", name: "U, The culvert's end", text:
        "The Sump Rats' culvert runs dashed under the plan, from the yard north to the grate, then on to the intake screens under T. Only the stretch south of the grate is walkable. Under the grate, the washdown pipe drips syrup into the channel, and the old catwalk stops." },

      { kind: "sub", name: "Floor 2" },
      { kind: "rule", name: "Q, Security booth", text:
        "A glass box on a steel stair over the dock's west end, with the yard to the south and the west lane to the north. Six monitors: the dock camera, the staff door camera, the stair camera (the ceiling), the drone's feed, the yard camera (NO SIGNAL), and the line's status screen. Under them, the alarm board: lamps marked ROOF HATCH, TREATMENT, and LAB DOOR, each lit while its door stands open. The radio, the gate and dock door controls, the drone's cradle, and a key cabinet (Easy lock) with hooks marked LAB, QA OFFICE, PLANT OFFICE, RACK R-3, and LIFT. Quill's mug says THIRTY DAYS SINCE. The number has been scratched off. Empty from 2:00 to 2:10; the Standby trooper from 2:10; Quill again from 2:25. The stair starts on the dock floor, in front of the dock camera. Pull the alarm board's bulbs (Engineering, Easy), and those doors can open all night. A charging drone isn't watching, and a drone pulled off its cradle before it finishes charging never takes off (the GM's call, and a fair one). Anyone still in the booth at 2:09 is a hand's width from it when it wakes." },
      { kind: "rule", name: "M, Packaging mezzanine", text:
        "Pallets of flat cartons, rolls of shrink film, label reels. Dim. The lift opens here, the roof hatch is at the east end, and the pallet gate on the north edge hangs over the staging lanes. It's the quiet back door to the catwalk, from the roof or the floor. Jerry brings a pallet up through the gate around 2:20. A pallet gate let swing bangs like a dropped door." },
      { kind: "rule", name: "The catwalk", text:
        "Steel grating with a rail and a kick plate, from the mezzanine along the top of the staging lanes to the office block's corridor. It's the lab corridor, it's in the drone's lap, and the floor can see it. Lie flat: the kick plate hides you from below, and the drone flies the middle of the corridor, not the grating." },
      { kind: "rule", name: "X, QA lab and formula server", text:
        "The QA lab on floor 2 has glass on three sides (Fragile cover), so the floor can see the lab and the lab can see the floor: north over the floor, west over the stacks, south onto the corridor. Benches of sample cubes, a water tester the size of a refrigerator, and the server in a locked rack cabinet in the back corner, next to a laminated sign that says DO NOT UNPLUG. FOR REAL. The door is a keyed lock (Moderate), with its own lamp on the alarm board; keys hang in the booth, ride on Quill's ring, and sit in Sorel's desk. The lights run on a motion sensor the drone trips through the glass every lap, so the booth only notices them between laps. Reach in and set the switch by the door to OFF, and the lab stays dark. The bench terminal is logged in behind a four-digit PIN. The retain fridge holds a month of sample jars, two with gold caps, 0412 and 0819, under a whiteboard: NEW REF = AUG RETAIN. Retire the April jar, Kevin. The rack (a Moderate lock, or the RACK R-3 key) holds two drive caddies marked HOT SWAP." },
      { kind: "rule", name: "O, Offices", text:
        "The QA manager's office and the plant office, dark and locked (Easy). Sorel's desk drawer (Easy) holds a binder: LM-5 SPECIFICATION, CONTROLLED COPY 2 OF 3, the formula and the source-water spec, about thirty pages. A sticky note under the blotter reads PIN = REF. Her voicemail greeting is ten seconds of her voice. The plant office holds the contractor's invoices (riot kit, billed by the hour) and the night roster." },

      { kind: "sub", name: "Outside" },
      { kind: "rule", name: "The yard", text:
        "Sodium lights, chain-link, a motorized gate with a manual latch, three tanker trailers marked FULLWELL WATER, and a camera on a pole that hangs at an angle no working camera hangs at. The Sump Rats shot it out during their pickets two springs ago, and the riot contract that followed cost more than a new one. The booth's south window watches the whole yard: cross between 2:00 and 2:10, or in the trailers' shadow. The fence has a cut from the pickets, patched with zip ties. Anyone who walks the fence line finds it." },
      { kind: "rule", name: "The roof", text:
        "The FULLWELL sign runs along the south edge, lit in four colors, with its service ladder in a locked cage (Easy) in the yard. The climb is Easy Athletics, in full color and full view of the Kilo Throughway; cut the sign's feed at the junction box beside the cage (Engineering, Easy), and nobody inside notices. Up top, wired-glass skylights run over the main aisle (Fragile): lie on one and watch a drone lap. One more sits over the mezzanine, painted over and screwed down from outside. Unscrewing it is Engineering, Easy with tools, about five minutes, and it opens onto pallets of flat cartons. The roof hatch is bolted from inside; opening it from up here takes Gantry's shoulder, and everyone on floor 2 hears it. A Failure on the climb rings the frame like a bell, and someone comes to look. A Critical Failure is a fall from halfway: 2d6 Bludgeoning, and the same bell." }
    ] },

    /* ---- SCENE 3: WAYS IN, THE NETWORK, THE FILE, SALVAGE, HAZARDS -------------- */
    { key: "ways", title: "Scene 3: Ways In and the File", tag: "THE NETWORK · THE FILE · SALVAGE · HAZARDS", blocks: [
      { kind: "section", name: "The Ways In", text:
        "The job is three problems in a row: get inside, get the file, get out without a face on a recording. Each has several answers, and no single Freelancer owns any of them.\n" +
        "Cameras and the drone record. A covered face doesn't count. An uncovered one in clear view does. Tell the players before they go in." },
      { kind: "section", name: "The No-Heat Clause", text:
        "The clause breaks when Fullwell can name a Freelancer. Nothing else breaks it: not an alarm, not a chase, not a plant that knows it was robbed.\n" +
        "- **A face on a recording names you.** A covered face doesn't. The masks are in H.\n" +
        "- **Plant footage stays in the plant.** The cameras record to a box in the booth, and nobody watches it until morning. A looped camera never records the crew. After the fact, brick the camera's Node or pull the recorder (one Action in the booth), and that face is gone.\n" +
        "- **The traffic drone uploads as it scans** (Scene 4).\n" +
        "- **Custody names you.** A Freelancer taken away in zip-ties is unmasked by morning. A crew that wins the fight and leaves with its masks on isn't.\n" +
        "- **A signature isn't a name tonight.** A logged hack or a forensic trail tells Fullwell it was hacked, not by whom. Tracker Scrub or Trace Cutter clears it. Left in the logs, it's a lead for Fullwell's analysts next month.\n" +
        "- **Heat is separate.** The chase can cost the crew Heat with Fullwell and still pay in full." },
      { kind: "table", name: "Way In",
        columns: ["Way In", "Needs", "Best When", "What It Risks"],
        rows: [
          ["The tunnel, up through G", "The Sump Rats (Scene 2)", "Before 2:30; it only runs one way after that (The Draw)", "Marisol and Jerry first, inside the drone's lap"],
          ["The staff door, quiet (S)", "A hack (Standard [0], Security Rating 12: it opens without a log entry) or a Moderate lock (2 Snag Dice, or DC 15 under pressure)", "Any time but 2:00 to 2:10", "The Door trooper, and the staff door camera"],
          ["The staff door, with a face", "Gantry as the contractor's night supervisor on a spot check (Flashing the Tin), and a covered camera", "Before 2:00", "Quill wants the spot check to go well, which means Quill is watching"],
          ["The dock, quiet (D)", "The dock camera looped, and the Dock trooper handled", "2:00 to 2:10", "Walking past the camera starts the response clock"],
          ["The dock, loud", "Gantry, or anyone with time on a chain hoist", "When the crew is ready for the clock", "Everything"],
          ["The roof", "A climb, and patience with screws", "Any time; the sign's light is the risk", "A fall, a bell, ten minutes lost"]
        ], strong: [0],
        after: "Inside, the pallet gate and Jerry's forks connect the floor to the mezzanine, and the stack tops connect the floor to the catwalk and the lab's west glass." },
      { kind: "rule", name: "Into the Lab", text:
        "The door's key hangs in the booth, rides on Quill's ring, and sits in Sorel's desk. The lock is Moderate. The glass is Fragile and loud. Tinsel can step through it with Reality Fracture. And a crew with two minutes of Sorel's voice can make Quill open it for them: Tinsel calls the booth as Dr. Sorel, the water tester is throwing a fault, could Tomasz possibly read her the display. He goes. He hates being the reason anything goes wrong, and he leaves the door on the latch while he walks back down to find a pen." },
      { kind: "table", name: "The Network",
        lead: "SR is Security Rating. Cipher Saves: Rudimentary +3, Standard +4, Improved +5. The lift, fire suppression, line controller, and server have System Integrity 20. The line controller and server sit behind Standard Firewalls (+2 SR, Damage Threshold 2).",
        columns: ["Node", "Tier and IC", "SR", "Hacked", "Alert"],
        rows: [
          ["Dock camera (D)", "Standard [0], Basic IC", "12", "Loops.", "Logs plates."],
          ["Dock doors and yard gate (Q)", "Standard [0], no IC", "12", "Any roll-up door or the yard gate opens or shuts.", "None."],
          ["Staff door (S)", "Standard [0], Basic IC", "12", "Opens without a log entry.", "Locks every door on the east side."],
          ["Staff door camera (S)", "Standard [0], Basic IC", "12", "Loops.", "Logs the face at the door."],
          ["Vending machine (V)", "Rudimentary [-1], no IC", "10", "Its purchase log names everyone on night shift, and what they eat at 3 a.m.", "None."],
          ["Washdown bot (B)", "Standard [0], no IC", "12", "Rolls where you say and sprays what you say (The Washdown).", "None. It files a ticket."],
          ["Palletizers (B), two: the cube line's and the water line's", "Standard [0], no IC", "12", "Swings, or builds a wall (The Palletizer).", "None. It files a ticket."],
          ["Underling fleet (W)", "Standard [0], no IC", "12", "Each pair carries a pallet where you say (The Underlings).", "None. It files a ticket."],
          ["Freight lift (L)", "Improved [1], no IC", "14", "Goes where you say, or stops between floors with someone in it.", "None. It files a ticket."],
          ["Fire suppression", "Improved [1], no IC", "14", "Foam fills the floor (The Foam).", "None."],
          ["Line controller (C)", "Improved [1] + Firewall, Basic IC", "16", "The line runs double speed and the floor turns to syrup (The Syrup Floor).", "Quill comes down to look, personally, and badly."],
          ["Formula server (X)", "Improved [1] + Firewall, Advanced IC", "16", "The formula.", "The Lab Seal."]
        ], strong: [0],
        after:
        "**Alerts.** Only a Node with IC can raise one. A failed hack on the vending machine or the fire suppression just fails. Every Alert starts the response clock, or skips a line of it, and then the Node's own Alert result happens too.\n" +
        "**Tickets.** The plant's machines answer to maintenance, not security. A failed hack on the washdown bot, the palletizer, the Underlings, or the lift raises no Alert: the machine logs a fault and pages the on-call tech, and the booth never hears about it. Not every mistake is a threat. Some just wake somebody up.\n" +
        "The bench terminal in the lab isn't a Node of its own. It's a window onto the server, so hacking it is hacking the server." },
      { kind: "section", name: "Getting the File", text:
        "The server sits in the QA lab on floor 2. Data Extraction only works at touch range, so somebody has to be in the room. Ledger opens a Link with Access Spike (Security Rating 16), then runs Data Extraction through it: the server makes a Cipher Save, d20 + 5, against her DC of 13.\n" +
        "- **The server fails:** a clean copy, and no trace.\n" +
        "- **The server saves:** she still gets the file, but it leaves a forensic trail, and the IC fires one response, your pick: Alert (the clock starts, and the lab seals) or Analyze.\n" +
        "A cipher that misses the server's Security Rating counts as resisted too, and fires a response the same way. Analyze is the server learning her habits: +2 to its Cipher Saves against her for the rest of the scene, and it stacks. Let the Codebreaker feel that. Second Language, Cipher Overdrive, and a Cold Boot to knock its IC offline first are all good answers." },
      { kind: "table", name: "Ways to the File",
        lead: "The hack is one way. There are four more, and most of them need no Codebreaker.",
        columns: ["Way", "Needs", "Time", "What It Costs", "What Fullwell Knows by Morning"],
        rows: [
          ["The hack", "A Codebreaker at touch range", "A few rounds", "A save leaves a trail and fires the IC", "Nothing on a clean copy. A trail on a save."],
          ["The bench terminal", "The PIN, and the Data Drive every Core Freelance Pack carries", "About a minute", "Wrong PINs (below)", "Nothing"],
          ["A mirror drive", "The rack open (the key or a Moderate lock)", "One round", "Nothing tonight. At 7 a.m. the server reports a dead drive.", "That it was robbed"],
          ["The controlled copy", "Sorel's office (O) and a camera: Ledger's deck has one, and so does any phone in the lockers (K)", "About ten minutes, page by page", "Time, on a clock that may already be ticking", "Nothing, if it goes back in order"],
          ["The whole server", "Gantry", "One round to pull, the rest of the night to carry", "Unplugging it raises the Alert: the Lab Seal, and the clock", "Everything"]
        ], strong: [0],
        after: "**Wrong PINs.** The first wrong PIN costs nothing but a try. The second reports a failed login to the server, and its IC goes watchful: +2 to its Cipher Saves for the rest of the scene, against anyone, like Analyze. The third locks the terminal and raises an Alert: the Lab Seal. After two misses the lockout warning reads CONTACT QA ADMINISTRATOR: A. SOREL, OFFICE 2-04. That's the lead. The office is twenty steps down the corridor, and Sorel keeps paper." },
      { kind: "rule", name: "Ways Out", text:
        "Back the way they came: the tunnel, before 2:30; the roof hatch opens freely from inside (its lamp lights while it's open); the staff door, if nobody's at it. Or the dock and the yard, the back door the job expects: if the clock is running, this is where Scene 4 starts. After the Lab Seal, see the Hazards." },
      { kind: "table", name: "Salvage",
        lead: "Everything in this plant has a price, and anything the crew carries out is pay nobody negotiated. It's also evidence.",
        columns: ["What", "Where", "Takes", "Fences For"],
        rows: [
          ["A crate of spares: servo packs, sensor heads, drone rotors", "The parts cage (Easy lock)", "Both hands per crate", "𝒢150 at a kiosk, 𝒢300 at a drone shop that doesn't ask"],
          ["A drum of cleaning concentrate", "The chem locker in T", "Both hands per drum", "𝒢60 to a street chemist"],
          ["An Underling skate", "Any pair, parked or stopped", "Both hands, and its board pulled first (Systems, Easy)", "𝒢250 a pair at a drone shop"],
          ["A pump or a servo arm", "A wrecked washdown bot or palletizer", "An hour, and Engineering, Moderate", "𝒢200 to the right shop"]
        ], strong: [0],
        after:
        "- **Drums split.** A drum that's dropped or shot splits: Agility DC 13 for anyone within 1 space, 2d6 Acid, half on a success. Empty the locker and the washdown bot sprays water only.\n" +
        "- **Skates talk.** An Underling reports its position until somebody pulls its board. Carry one out with the board still in, and Fullwell can follow it home.\n" +
        "- **Or ride one.** Hacked loose and rewired, a single skate makes a fast, low, ugly skateboard. A rider's Speed doubles. Stairs and Difficult Terrain stop it: step off and carry it. Take damage while riding: Agility DC 13, or you land Prone and the skate keeps going. In the chase, a pace-setter on one rolls the Chase Check with Edge on the Service Road and with Snag on the planks.\n" +
        "- **Ledger's debt.** Her scrapyard takes parts against her deck debt at the drone shop's price, and asks nothing either.\n" +
        "- **Fullwell counts.** The cage every Monday, the chem locker every morning, the fleet every shift. Anything missing tells Fullwell it was robbed. That alone doesn't break the no-Heat clause: Fullwell has to name the crew. But a robbed plant pulls its footage, and a face on any of it does. Fence it far from Fullwell and not this week: hot goods sell for half." },
      { kind: "table", name: "Hazards",
        lead: "Five of these change the fight. Three are the fight. The syrup, the foam, the washdown, the palletizer, and the Underlings come from hacking the network; the rest are waiting on the floor. Saves are DC 13, Grade 2.",
        columns: ["Hazard", "Trigger", "Save", "What It Does", "Counter"],
        rows: [
          ["The Presses", "Being shoved into a press station's footprint, or reaching into one", "Agility DC 13",
            "2d6 Bludgeoning, half on a success. A Riot Trooper shoved in is out of the fight. The slab it lands on comes out in its own color.",
            "The line controller, the red stop button on each station (one Action, adjacent), or not standing there"],
          ["The Syrup Floor", "The line controller hacked to double speed. Slurry floods the floor in one round", "Agility DC 13 for anyone who Dashes on it",
            "The whole floor is Difficult Terrain. A failed save is Prone.",
            "The controller again, or the drain grate, which clears a 3-space circle around it in two rounds"],
          ["The Foam", "Fire suppression hacked, or anyone setting fire to something", "None",
            "The floor is heavily obscured until the end of the third round. The Spotter Drone is blind in it. So is everyone else.",
            "Wait three rounds, or get above it: the pallet tops and the security booth are both clear"],
          ["The Washdown", "The washdown bot hacked. Each spray takes the hacker's Action, and the bot rolls up to 6 spaces first", "Agility DC 13 for anyone in an Area 4 cone from the bot's lance",
            "2d6 Bludgeoning, pushed 2 spaces away from the bot and Prone; half and no push on a success. The floor in the cone stays wet, Difficult Terrain, for the rest of the scene. Hacked past its label (full concentrate, near boiling), the damage is Acid, and armor doesn't stop it.",
            "Heavy cover, the bot's E-stop (one Action, adjacent), or an empty chem locker, which leaves it water only"],
          ["The Palletizer", "The palletizer hacked. Each order takes the hacker's Action", "Agility DC 13 for anyone in an Area 2 aura around it, when it swings",
            "Swing: 2d6 Bludgeoning and Prone, half on a success. Or build: in one round, a line of cartons 3 spaces long, within 3 spaces of it. It's Average cover (Structure 9, Integrity 12), the same as a pallet.",
            "Stay out of its reach, or its E-stop (one Action, adjacent)"],
          ["The Underlings", "The Underling fleet hacked. Each order moves one pair and takes the hacker's Action", "Agility DC 13 for anyone the pair drives its pallet into",
            "A pair carries a pallet up to 6 spaces: cover that moves (Average, Structure 9, Integrity 12), parked across a lane or a doorway, or run into someone for 2d6 Bludgeoning and Prone, half on a success. A Freelancer lying flat on the pallet rides along. The blue floor spots show where a pair is headed, to anyone watching.",
            "Get out of the lane, or a red E-stop at either end of each skate (one Action, adjacent)"],
          ["The Pallet Canyon", "A stack takes 12 or more damage in one hit, or a forklift clips it", "Agility DC 13 for anyone in the lane it falls into, a strip 2 by 4 spaces",
            "2d6 Bludgeoning, half on a success, and the lane is blocked. Thousands of bottles of Fullwell water burst at once, and that stretch of floor is Difficult Terrain.",
            "Don't shoot the stacks. Or shoot them on purpose, while the troopers are in the lane"],
          ["The Lab Seal", "The formula server raises an Alert", "None",
            "The lab door seals from outside (Fortified: Structure 14, Integrity 24). That Alert moves the clock once, not twice. When the patrol arrives, it comes up the freight lift to the lab. Whoever's in the lab is in a glass box, two stories up.",
            "Through the glass (Fragile, 5 and 3) and down a pallet stack (Athletics, Moderate or DC 15, or falling damage at 1d6 per 2 spaces). Or the freight lift, hacked to stop between floors with the patrol in it"]
        ], strong: [0] }
    ] },

    /* ---- SCENE 3: THE PEOPLE ON SHIFT, AND THE ALARM --------------------------- */
    { key: "alarm", title: "Scene 3: People and the Alarm", tag: "LINE WORKERS · ON-CALL TECH · THE RESPONSE CLOCK", blocks: [
      { kind: "section", name: "The Line Workers", text:
        "The line runs all night, so two people run the line. They don't fight, and they don't run for the alarm unless someone gives them a reason. If the crew starts something anyway, Marisol is a Bystander and Jerry has a block of its own (Forklift Jerry)." },
      { kind: "threats", names: ["Bystander", "Forklift Jerry"] },
      { kind: "rule", name: "Marisol Tan", text:
        "Human, line lead, fifteen years in, ear defenders on. She's the one whistling. On seeing the crew, she pulls one ear defender aside and looks at them for a long second. \"Are you here for us, or for them?\" If they're honest: \"Then I'm on break.\" She walks to the break room and sits with her back to the door. If they threaten her, she hits the station stop, which raises an Alert on the line controller. Then she sits down anyway. On the water: \"We don't drink the product. Nobody on the line does. Ask yourself why.\"" },
      { kind: "rule", name: "Forklift Jerry", text:
        "Clanker, a forklift-chassis line hand. That's its formal name, and the only one anyone here knows. On seeing the crew, it stops, backs up four meters, and waits. Asked to help: \"I am not authorized.\" A pause. \"I am not authorized to notice you, either.\" It parks a pallet across the security booth's sightline and leaves it there. A crew that asks its real name and gets an answer has a friend for the next job here. Around 2:20 it lifts a pallet of cartons through the pallet gate to the mezzanine. A crew that has been decent to it can ask for a ride. \"I am not authorized to lift persons.\" A pause. \"I am authorized to lift pallets.\" It lowers the forks." },
      { kind: "card", name: "The On-Call Tech", slug: "the-on-call-tech", tag: "RESOLVE 3",
        aside: "Teo Okonkwo (#PRINT: Teodor Okonkwo-Reyes, on the payroll of three companies that don't know about each other)",
        lines: [
          ["Work", "On-call maintenance for four Fullwell plants, from his kitchen table, paid by the night whether he comes in or not."],
          ["Want", "To go back to bed."],
          ["Fear", "A broken machine with his name on the last ticket."],
          ["Resolve", "3 (Pushover)."],
          ["Their Profile of You", "Off the Books."],
          ["Tell", "Gets the plant wrong in every message, then fixes it: \"tollgate u good? sorry. flats.\""]
        ],
        text:
        "Tickets add up across the night, from any machine.\n" +
        "- **One ticket.** Teo reads it on his phone and power-cycles the machine from his kitchen. It's dead for a minute, and any Link into it drops. A Freelancer at the machine's panel can get there first: the screen reads FAULT LOGGED, then a chat line, \"tollgate u good? sorry. flats.\" Answer as line staff (Deception, Easy) and he closes the ticket himself.\n" +
        "- **Two tickets.** Teo calls the booth. \"Your washdown bot's throwing faults. Somebody bump it?\" That's a look: Quill sends a trooper.\n" +
        "- **Three tickets.** Teo drives in. He's at the staff door in about twenty minutes, in a hoodie, with a toolbag and a face the Door trooper waves through.\n" +
        "**If he meets the crew.** He isn't security, and he isn't paid like it. If the machine still runs and nobody's bleeding, he looks at them for a long second and decides they're contractors. \"I'm here for the bot. You're not the bot.\" He fixes it, types OPERATOR ERROR and goes home. If the machine is wrecked, he has to write it up, and the write-up says what he saw, unless someone gives him a better story for the form (Persuasion or Deception, Easy) or covers his gas (𝒢50). Threaten him and he walks straight back to the booth: a search, with a description.\n" +
        "Most of the people who keep this city running don't get paid enough to care what a stranger is doing, and some of them will look right at you and decide not to see it. Don't count on it twice." },
      { kind: "section", name: "Running It", text:
        "- **Shift change.** At 2 a.m. there are ten minutes with the monitors unwatched. A crew that times it right starts any fight with the night shift Surprised.\n" +
        "- **Cover is everywhere.** Pallets of product are Average cover (Structure 9, Integrity 12). The lines and the vats are Heavy (11 and 18). The glass of the QA lab is Fragile (5 and 3) and very expensive.\n" +
        "- **Free terrain.** A hacked line controller, fire suppression system, washdown bot, palletizer, or Underling fleet changes the fight at no cost to the crew. Remind the Codebreaker it's there.\n" +
        "- **The drone is the alarm.** It does laps of the bottling floor and the lab corridor, in a cheerful Lonely Mouth jingle voice that someone in marketing thought was a good idea. When it spots the crew or takes damage, it Squawks (\"You are in a restricted area. Please remain where you are. Thank you for choosing Lonely Mouth.\"), and the response clock starts. An Alert from a Node with IC starts it too." },
      { kind: "table", name: "How the Alarm Climbs",
        lead: "Most failures in this plant make the night shift look. Some only page maintenance. Very few make it call. Small mistakes cost time and position; only five things start the clock.",
        columns: ["Level", "What Sets It Off", "What the Night Shift Does", "How the Crew Gets Out from Under It"],
        rows: [
          ["A ticket", "A failed hack on the washdown bot, the palletizer, the Underlings, or the lift",
            "Nothing. The on-call tech resets the machine from home, and it's dead for a minute.",
            "Answer his chat as line staff (Deception, Easy), or wait out the minute. A second ticket is a look; a third brings him in."],
          ["A look", "A shape in the yard, a noise in the stacks, a lamp on the alarm board, lights or the line going off, the lab lit between drone laps, a radio check nobody answers, a crew sneaking together where anyone fails the Stealth roll",
            "Quill sends one trooper, or looks himself on his walk. About three minutes to arrive, a minute with a flashlight.",
            "Be gone, be hidden, or be explained: Tinsel on the radio, \"Floor. It's the yard cat again.\" Or deal with one trooper alone, quietly."],
          ["A search", "The look finds something real: a body, a forced lock, wet boot prints, an open skylight. Or two posts stop answering.",
            "Everyone on the radio. The troopers pair up and sweep out from where the evidence was. The drone stops lapping and hovers there. Quill still doesn't call Dispatch.",
            "Stay unfound for about ten minutes, and Quill decides it was raccoons and writes nothing down. Or give him a better answer than raccoons."],
          ["The clock", "The drone sees the crew or takes damage. A Node with IC raises an Alert. The fire bells. A fight that goes loud. Quill sees an intruder with his own eyes.",
            "Quill calls it in, and Dispatch starts reading lines.",
            "Nobody backs this one down. Leave."],
          ["Lockdown", "The server's Alert (the Lab Seal), or the staff door's (the east side locks)",
            "Whatever the Alert says",
            "The ways out under Getting the File"]
        ], strong: [0],
        after: "**The radio checks.** Every quarter hour, Quill calls the posts by sign: Dock, Floor, Door, Standby. The 2:00 check happens in person at the time clock. A post that doesn't answer gets a second call a minute later, and then a trooper sent to look. Tinsel, with a minute of the missing trooper's voice, answers for him with Edge (Social Chameleon). Anyone else is a Deception check with Snag." },
      { kind: "rule", name: "Why Quill Waits", text:
        "The drone, a Node with IC, and the fire panel call Dispatch on their own. Quill calls only when a fight goes loud or he sees an intruder himself. Not before. He'd rather be wrong about a raccoon for ten minutes than right about a burglar in a supervisor's report. That's his Fear, and it's the crew's best friend in the building. Play it straight, and let the players find it." },
      { kind: "table", name: "The Response Clock",
        lead:
        "A Working site's response usually comes faster with every Alert. For a first-night crew, this one counts down instead: the Dispatch lines below are the clock. The round it starts, tell the players and read line 6. Read one line a round after that. Every new Alert, every Squawk, and every 3 loud rounds skips a line. At 0 the patrol is in the yard: a Standard patrol at Grade 2, Officers Doan and Pryce in a security sedan. The crew should be leaving by then, not fighting it. Scene 4 picks up there.\n" +
        "Once the clock starts, the radio in the booth narrates it. Keep the table where the players can watch you count it down.",
        columns: ["Rounds Out", "Dispatch Says"],
        rows: [
          ["6", "\"Fullwell Dispatch to Flats Bottling. We show an alert on your site. Confirm?\""],
          ["5", "\"Unit Four, roll on Flats Bottling. Possible intrusion.\""],
          ["4", "\"Unit Four rolling, coming down the Kilo.\""],
          ["3", "\"Unit Four, off the Kilo onto the service road.\""],
          ["2", "\"Unit Four is two out. Booth, open the yard gate.\""],
          ["1", "Headlights in the yard. Four colored stripes on a white sedan."],
          ["0", "Scene 4 starts."]
        ], strong: [0] },
      { kind: "section", name: "When It Goes Wrong", text:
        "It will. The night shift is a grade above the crew on purpose, the plant was built by people paid to stop exactly this, and the clock doesn't care how good the plan was. Say so out loud the first time something breaks. Then say the rest. The crew read the clause. Odette tapped the counter twice. Nobody in Elysium hires Freelancers for the easy nights; they hire them because a Freelancer is the one who hears the alarm and starts counting stairs. Every room in this plant has another way through it. Ask the table which one is still open, and wait." },
      { kind: "section", name: "Optional: Machine Twelve", text:
        "For a table that wants a taste of the city's stranger corners on night one. Skip it for a tight four hours.\n" +
        "Machine twelve, the left vending machine in the break room, is a Nixie's host: a Flow-sprite that has decided this machine is worth living in. Nobody on shift knows. Its purchase log is always a little wrong in someone's favor, and its Node runs a tier above its spec sheet (Standard [0], Security Rating 12). When a Freelancer first walks in, it drops a can of Fullwell water into the tray, unasked, and its display reads THANK YOU.\n" +
        "A crew that hacks it finds the purchase log and nothing else. The Nixie doesn't fight and doesn't flee. A crew that's polite to it (a coin in the slot, a thank you, Restock's hello passed on) finds the dock camera loops itself for exactly as long as they need it to. Don't explain why.\n" +
        "Hurting the machine is a mistake that keeps costing. Mistreat a Nixie's home and what comes back down the wire someday is a Gremlin, and it remembers whose fault that was. Kill the Nixie and it's Wronged: once per session, the GM may have one of the offender's devices fail at the worst plausible moment, until amends are made at a shrine that knows its name. A first-night crew shouldn't have to learn that the hard way." }
    ] },

    /* ---- SCENE 3: HANDOUTS ------------------------------------------------------ */
    { key: "handouts", title: "Scene 3: Handouts", tag: "BREAKERS · RETAINS · CORKBOARD", blocks: [
      { kind: "table", name: "The Breaker Schedule", plain: true,
        lead: "The breaker schedule (E). Breakers 4 and 6 are swapped on the card, and the handwriting says so for anyone who reads it all. Reading it right in play is Engineering at Moderate.",
        columns: ["Breaker", "Printed Label", "Handwritten"],
        rows: [
          ["1", "YARD LIGHTS", ""],
          ["2", "YARD GATE", "manual latch still works"],
          ["3", "DOCK DOORS", ""],
          ["4", "FLOOR LIGHTS, NORTH", "flipped 4 for the bulb change and the LINE stopped. Marisol was NOT happy"],
          ["5", "FLOOR LIGHTS, SOUTH", ""],
          ["6", "LINE, PRESSES 1 TO 4", "6 = north lights?? (Kevin)"],
          ["7", "FREIGHT LIFT", "bell is on this too, don't"],
          ["8", "MEZZANINE", ""],
          ["9", "OFFICE BLOCK, FLOOR 2", "lab + offices"],
          ["10", "BREAK ROOM", "microwave AND vending. do not"]
        ], strong: [0] },
      { kind: "handout", name: "The Retain Fridge and the Whiteboard",
        lead: "The retain fridge and the whiteboard (X). A month of nightly jars, each labeled with its batch code, and two with gold caps.",
        lines: [
          "LM-5 RETAIN   BATCH 1021      LM-5 RETAIN   BATCH 1022",
          "LM-5 RETAIN   BATCH 1023      LM-5 RETAIN   BATCH 1024",
          "[GOLD CAP]  LM-5 REFERENCE RETAIN   BATCH 0412",
          "[GOLD CAP]  LM-5 REFERENCE RETAIN   BATCH 0819",
          "WHITEBOARD:  NEW REF = AUG RETAIN.",
          "             Retire the April jar, Kevin."
        ] },
      { kind: "handout", name: "The Break Room Corkboard",
        lead: "The break room corkboard (V).",
        lines: [
          "NIGHT ROSTER   OIC: T. QUILL",
          "RADIO CHECKS   :00  :15  :30  :45   (2:00 IN PERSON AT THE TIME CLOCK)",
          "CALL SIGNS     DOCK   FLOOR   DOOR   STANDBY",
          "SWIPE AT 2:00. THE CONTRACT CHECKS.",
          "LAB DOOR ALARMED AFTER HOURS. YES, EVEN YOU, KEVIN.",
          "LIFT BELL IS A SAFETY FEATURE. STOP DISCONNECTING IT."
        ] }
    ] },

    /* ---- THE NIGHT SHIFT ---------------------------------------------------------- */
    { key: "nightshift", title: "Scene 3: The Night Shift", tag: "FIVE STAFF AND A DRONE · 375 XP", blocks: [
      { kind: "prose", text: "Five staff and a drone. If the crew ends up in a fight inside the plant, this is who they're fighting." },
      { kind: "table", name: "Who's on Shift",
        columns: ["Threat", "Count", "XP"],
        rows: [
          ["Corpsec Officer (Tomasz Quill)", "1", "150"],
          ["Riot Trooper", "4", "200"],
          ["Spotter Drone", "1", "25"],
          ["Total, for a 400 XP Fair Fight", "", "375"]
        ], strong: [0],
        after: "The officer and troopers are Grade 2, one step above a Caliber 1 crew: a hard night, on purpose. The shift change, the tunnel, the foam, and a door that opens itself are how a smart crew makes it fair. A smaller crew faces fewer troopers (Scaling). Their stat blocks are in the Bestiary." },
      { kind: "threats", names: ["Corpsec Officer (Quill, Doan, Pryce)", "Riot Trooper (Quick-Start)", "Spotter Drone (Quick-Start)"] },
      { kind: "card", name: "Tomasz Quill", tag: "RESOLVE 5",
        print: "Tomasz Quill-Barańska, a second family he keeps quiet at work",
        lines: [
          ["Work", "Night shift Corpsec officer, Fullwell Bottling, Synth Flats. Eleven years."],
          ["Want", "Two more quiet years and his pension."],
          ["Fear", "A supervisor's report with his name on it."],
          ["Resolve", "5 (Standard)."],
          ["Their Profile of You", "Desperate. He's seen a hundred kids in cheap kit try something."],
          ["Tell", "Ends every radio call with the time. \"Booth. 2:14.\""]
        ],
        text:
        "- **First sight of the crew:** he doesn't draw. Not yet. \"Okay. Okay. Nobody's done anything I've written down yet. Let's keep it that way.\"\n" +
        "- **If they draw first:** carbine up, voice flat. \"Floor, booth. Contact, bottling, at least four. Shields up. Nobody be a hero, it's not our product.\" Then the time, whatever it is.\n" +
        "**Talking him down.** Mid-fight, it's a single Persuasion check, DC 15, with Edge if the offer protects his pension. Intimidation doesn't move him; he's been threatened by better. On a success: \"Zip-tie me to the stair rail. Tight. Hit the camera on your way past. If my report says I was overpowered, it says I was overpowered.\"" },
      { kind: "rule", name: "The Riot Troopers", text:
        "Four, paid by the hour. They talk to each other more than to the crew: \"Shields together. Together! Why is it always me on the end?\" Offered a way out, the first one to put down a baton says, \"I didn't see anything and I'm going to the break room.\" The others follow within a round unless Quill is up and watching them." },
      { kind: "section", name: "Running the Fight", text:
        "- **Threats are simpler than Freelancers.** Vitality only, no Wounds: at 0 they're out of the fight. Minions get no defensive Impulse. Quill gets one per round. Each stat block's number is the whole bonus.\n" +
        "- **The drone first.** Six Vitality and a Rudimentary Node. A crew that takes it out quietly, before it sees them, keeps the clock from starting. A crew that shoots it starts the clock anyway: Squawk fires when it takes damage.\n" +
        "- **Talking works.** Quill is two years from a pension and has Resolve 5. The troopers are paid by the hour, Resolve 3. Offer them a way out mid-fight and they'll usually take it. The XP is the same.\n" +
        "- **Morale (optional).** When the night shift loses Quill, or half its number, the survivors make a Presence Save, DC 12. On a failure they break: they retreat, surrender, or develop a sudden interest in guarding a different hallway.\n" +
        "- **Nonlethal counts.** Tasers, batons, Lights Out, and Sedative all leave people breathing. Dead guards make reports. Unconscious guards make excuses.\n" +
        "- **Experience.** If your table tracks XP, total the defeated threats' values and give that number to every Freelancer. Defeated includes captured, routed, hacked, bypassed, or talked down." }
    ] },

    /* ---- SCENE 4: OUT THE BACK ----------------------------------------------------- */
    { key: "outback", title: "Scene 4: Out the Back", tag: "EXECUTION · A FOOT CHASE ON THE LEAD TRACK", blocks: [
      { kind: "prose", text:
        "Execution. About 40 minutes. A foot chase, and a clock the crew can't see.\n" +
        "The response patrol arrives in a Fullwell security sedan, white with four colored stripes, and sees the crew going out the back. Run it as a mixed chase on the Lead track: the crew is on foot, and the sedan isn't. If the crew got out clean before the clock ever started, skip this scene and go to Payday. If the clock was running and they cleared the yard before the patrol arrived, the sedan picks them up on the Service Road: start at Lead 3." },
      { kind: "aloud", text:
        "A white sedan with four colored stripes down the side comes through the yard gate too fast and stops too late. The doors are armored and the windows are dark. A loudspeaker on the roof clicks on. Then off. Then on again." },
      { kind: "section", name: "The Setup", text:
        "Running: the crew, on foot, with the file. Chasing: two Corpsec Officers in an Armored Sedan. They want the file and the faces, in that order.\n" +
        "- **Officer Ines Doan, driving.** Young, good, and trying to make sergeant on this one. She doesn't talk. She drives.\n" +
        "- **Officer Gil Pryce, on the loudspeaker.** Older, bored, very much hoping this ends before his coffee goes cold. \"This is Fullwell Corporate Security. Stop where you are. You are not under arrest. You are being asked nicely.\" Then: \"We just want the drive back. And your names. Mostly the drive.\" When the crew tilts the chase: \"That was Fullwell property. All of that was Fullwell property.\"" },
      { kind: "threats", names: ["Corpsec Officer (Quill, Doan, Pryce)"] },
      { kind: "rule", name: "Fullwell Security Sedan", tag: "ARMORED SEDAN", text:
        "Armored Sedan. Ground vehicle, Enclosed.\n" +
        "Speed Standard · Handling +0 · Structure 14 · Integrity 45 · Node Improved [1], Security Rating 14, System Integrity 20\n" +
        "The driver is a Grade 2 threat: piloting checks at +6, and the moving sedan's Defense is 12. Hits below Structure 14 do nothing to it." },
      { kind: "table", name: "The Lead Track",
        lead: "Lead measures the gap, from 0 (Contact) to 5 (gone). The chase starts at Lead 2 (Close). If the crew fought the response patrol before leaving, start at 1.",
        columns: ["Lead", "Band", "Gap"],
        rows: [
          ["0", "Contact", "0 to 1 spaces"],
          ["1 / 2", "Close", "6 / 12 spaces"],
          ["3 / 4", "Distant", "24 / 48 spaces"],
          ["5", "Escape", "out of sight"]
        ], strong: [0],
        after: "A weapon, cipher, or ability reaches the sedan if its Range covers the gap. A Quick Hack's 12 spaces works through all of Close and dies at Distant." },
      { kind: "section", name: "The Chase Check", text:
        "Each round, both sides make a contested roll. The crew picks one runner to set the pace: d20 + Agility Modifier + Athletics or Acrobatics Proficiency. The driver rolls d20 + 6.\n" +
        "- **Runner wins:** Lead +1, or +2 if they win by 5 or more.\n" +
        "- **Driver wins:** Lead -1, or -2 if they win by 5 or more.\n" +
        "- **Tie:** a Stalemate. Lead stays put, and you roll on the Sumpside table.\n" +
        "**Tilting.** Each round, one of the other runners can tilt the chase with a plausible action. The route below gives every stretch its own. A success gives the pace-setter Edge, or the driver Snag. One tilt per round counts; a second helper adds nothing.\n" +
        "**System Hits.** Some results move Lead 1 in the crew's favor on the spot, on top of the contest, but no more than once a round: the sedan dropping below half Integrity (a tire goes, and the driver takes Snag on the next check), a critical hit on the sedan taken as a System Hit instead of its normal critical effect (the attacker chooses), a Quick Hack that beats the sedan's Security Rating by 10 or more, or a Hotwire that makes the car do the wrong thing at the wrong moment." },
      { kind: "table", name: "The Route",
        lead: "Move the crew down this list as the Lead climbs. If the Lead drops, they hold the stretch they're on while the sedan closes. Nobody runs backward. The Edge column says who rolls the Chase Check with Edge on that stretch.",
        columns: ["Stretch", "Lead", "Edge", "Tilts"],
        rows: [
          ["The Loading Yard: sodium lights, chain-link, three tanker trailers marked FULLWELL WATER, and a yard gate Quill opened for the sedan", "Start (2)", "Neither",
            "Close the yard gate on the sedan (the dock doors and yard gate Node, if they hold a Link to it, or a shoulder on the manual latch). Go under the tanker trailers, where the sedan can't follow. Open a tanker valve and flood the yard: Difficult Terrain for everyone, Snag for the driver."],
          ["The Service Road: a straight concrete kilometer, a drainage ditch on one side and dark worker housing on the other", "2 to 3", "Sedan",
            "Drop into the ditch (the sedan can't follow, but it's wet Difficult Terrain). Cut between the housing units (Moderate Athletics or Acrobatics to find the gap). A Quick Hack on the sedan's Node. A pallet of bottled water off a delivery cart and into the road."],
          ["The Kilo Underpass: the throughway roaring overhead on pillars, and a shrine at the base of one, FOR THE BLOCKS THAT WENT UNDER", "3", "Neither",
            "Weave the pillars so the sedan has to go around. Wake a Safekeep drone on its charger by the off-ramp and point it at the wrong car. A Freelancer who touches the shrine as they pass gets nothing for it. Nalo hears about it by morning. Use that."],
          ["The Hollow Bend Ramp: patched asphalt, then planks, then planks on stilts, under a sign that says NO VEHICLES OVER TWO TONNES with TWO crossed out", "4", "Crew",
            "See below."],
          ["The Stilt Lanes: planks a meter wide over black water, laundry everywhere, two radios playing two songs", "4 to 5", "Crew",
            "Through the laundromat, past the dryer with the candles above it. Under a laundry line, cut behind you. Over a gap between walkways (Moderate Athletics, or swim). Past the noodle stand, where the regulars shift their stools to close the gap."]
        ], strong: [0] },
      { kind: "rule", name: "The Hollow Bend Ramp", text:
        "The sedan isn't built to go past the bottom. Doan stops and decides. Roll a d6. On 1 to 3 she gets out and runs, and the chase continues on foot with Doan as a Grade 2 pursuer, still rolling d20 + 6. On 4 to 6 she tries it, and takes Snag on every Chase Check while the planks complain. Pryce: \"Doan. Doan, we can't take the car in there. Doan.\" If she goes on foot: \"Fine. I'll guard the car. Somebody has to guard the car.\" If she runs, Doan is the only one still chasing." },
      { kind: "section", name: "The Two Endings", text:
        "- **Escape at Lead 5 into the stilt lanes.** If Undertow is friendly, Silt is on a pump-house gate at the end of Pell Street, hand on the wheel. \"Go, go, go.\" The gate drops behind the crew, and the chase ends. If Doan is on foot, she stands at the bars and looks at them for a long moment. She'll remember the faces whether a camera did or not. She doesn't file it. She's going to want something from them someday. Copper's Ghost Routes can get everyone home without a camera seeing which way they went.\n" +
        "- **Capture at Lead 0.** It happens on the stretch the crew is standing on. Before the ramp, the sedan cuts across the lane and both officers get out: a short fight against two Corpsec Officers (300 XP). Past the ramp it's Doan alone, on foot (150 XP), while Pryce guards the car. If she drove the planks, it's both officers (300 XP). Win, and the crew walks away with the file and its masks on. Anyone taken away in zip-ties is unmasked by morning, and that breaks the clause (The No-Heat Clause, Scene 3)." },
      { kind: "section", name: "The Traffic Drone",
        text: "It arrives at round 5 and logs faces. A covered face doesn't count. That's what breaks the no-Heat clause, so make it visible.",
        aloud: "A Safekeep drone drops out of the dark above the service road, humming the same three notes all of them hum, and swings its camera toward you.",
        after: "For a first-night crew: if anyone blinds, bricks, or flips it in the round it arrives (it carries a Rudimentary [-1] Node, Security Rating 10, like the Spotter Drone), or the crew is under cover when it scans, the log never uploads. Tell the players it's possible the moment it appears. A first job that dies to a camera they never had a chance at teaches the wrong lesson." },
      { kind: "table", name: "Stalemates: Sumpside",
        lead: "On a tie, roll a d6. Unless the entry says otherwise, each side then makes a check against the hazard, DC 12 for a runner on foot and DC 14 for the driver, and a failure means Snag on the next Chase Check.",
        columns: ["d6", "Result"],
        rows: [
          ["1", "Standing runoff a hand deep across the whole road."],
          ["2", "A pump station vents. The street is heavily obscured, and smells like it."],
          ["3", "Hollow Bend's stilt lanes sway under the weight. Heavy vehicles check twice."],
          ["4", "The Sump Rats lift a gate for one side. Roll a d6: odd, the crew; even, whoever paid them last."],
          ["5", "A Synth Flats tanker jackknifes, slowly, beautifully, everywhere."],
          ["6", "The road ends at an Undercity stair. Everyone dismounts, or finds out what Structure means."]
        ], strong: [0] }
    ] },

    /* ---- SCENE 5: PAYDAY ------------------------------------------------------------ */
    { key: "payday", title: "Scene 5: Payday", tag: "FALLOUT · ABOUT 30 MINUTES", blocks: [
      { kind: "prose", text: "Fallout. About 30 minutes." },
      { kind: "aloud", text:
        "At the end of Hollow Bend, where the stilt lanes run out and there's nothing past the rail but black water and the lights of the pumping stations, there's a noodle stand. One burner, always lit. Five stools. A tarp roof that drips. The cook is a broad woman in a knit cap who keeps her eyes on the broth and doesn't ask anyone what they did tonight. She sets down bowls before you order. When you go to pay for a second round, she waves it off. Nobody has ever paid for a second bowl here." },
      { kind: "prose", text:
        "The cook is called Mother Ash, and nobody uses anything else. She has three lines all night, and they're the right three. When they sit down: \"Eat first.\" When they open the file and go quiet: \"Bad news tastes better hot.\" When they leave: \"Pump's still running. Good night to be dry.\" Kettle is on his stool. If the crew helped the Sump Rats, he raises his bowl to them and says nothing." },
      { kind: "section", name: "The File",
        text: "Somewhere safe, someone opens the file. Hand over the handout when someone says they open it.",
        handout: { name: "Handout: The File", lines: [
          "LONELY MOUTH BRANDS / QA LAB, FLATS BOTTLING. INTERNAL. DO NOT DISCLOSE.",
          "Formula LM-5 (\"House\"). Base culture: Fullwell vat strain FW-112. Sodium chloride, 38 percent by dry weight. Mineral profile attached. Patent 7-0041-LMB.",
          "Marketing note: Lonely Mouth House Flavor captures the ancestral purity of Elysium's natural waters, the taste of home, before the city. All four retail flavors are finished from House.",
          "Attached: Source Water, Intake Log. Source: Clearline Intake HB-4, Hollow Bend (wellhead capped for contamination, decommissioned). Nightly draw, 2:30 to 2:36. Mineral profile of source water matches formula profile.",
          "Note from QA: The source water is the flavor. Do not substitute. Do not disclose source."
        ] },
        after:
        "The fifth flavor is mostly salt: a mineral profile, a patent number, a paragraph of marketing copy about \"ancestral purity.\" Under it is the intake log the formula was built from: metered volume, nightly, from a capped wellhead under Hollow Bend. The fifth flavor is Sumpside's groundwater. Fullwell grows its cubes in it, presses them in four colors, and sells them back downhill.\n" +
        "**What the file proves.** Fullwell capped the wellhead on a contamination claim, then put its own intake beside the cap. It sells Sumpside its own water. Whether that water is safe to eat isn't in the file. Marisol's line and Undertow's are suspicion, and the answer is a job for another night.\n" +
        "That's the complication. It's the only one, and it lands after the job is done, so it costs the crew a choice instead of a plan. Let the players work it out. If they don't, Marisol's line (\"we don't drink the product\") or Undertow's (\"contaminated water makes very good cubes\") is the nudge. Say it in that person's voice, as a memory. If Sunday's at the table, let the player have a moment: Undertow's grove was that wellhead, and a Verdine knows what it means when a grove gets capped and the water keeps flowing." },
      { kind: "section", name: "The Choice", text:
        "- **Deliver to Odette.** The posting pays: 𝒢1,800 to the crew after the Exchange's cut, or 𝒢1,950 if they talked her up to 𝒢2,600. If the no-Heat clause broke (The No-Heat Clause, Scene 3), the client walks and nobody gets paid. Odette's Profile of the crew becomes Good for It if it paid, Difficult if it didn't.\n" +
        "- **Give Undertow a copy.** If the Sit-Down promised it, this is keeping a promise. If it didn't, it's a gift. Either way the Sump Rats think one step better of the crew, and the pump house becomes a door that opens at 4 a.m.\n" +
        "- **Both.** Nothing stops them. The client will notice eventually, and that's next month's session.\n" +
        "**Delivering to Odette.** Back at the Crossing Bowl, the printer chatters. Odette reads the file's first page, not the attachment. If the clause held: \"Formula. Salt. Patent number.\" Tap. \"Clean.\" She counts out the crew's share in Glimmer chits, one at a time, out loud. \"You're Good for It now, on my sheet. Don't make me change the ink.\" If they bring photographs of the controlled copy instead of a drive: \"Paper.\" Tap. \"It'll do.\" It pays the same. If the clause broke, she doesn't open the file. \"Faces on a traffic log. The client already called.\" Tap, tap. \"Nobody gets paid. You knew that clause when you signed it. I read it twice.\" A pause. \"Eat something before you go. I'm not a monster.\"\n" +
        "**Giving Undertow a copy.** The pump house at 4 a.m. The card game is still going. Undertow reads the whole thing, attachment included, twice. If the Sit-Down promised it: \"You came back.\" A quarter turn on the valve wheel. Then a full one, for the first time all night. \"Nobody comes back.\" If it's a gift: \"I didn't ask you for this.\" Long silence. \"Silt. Put them on the gate list.\" Either way, on the intake log: \"Eleven years. They capped my grove for contamination and they've been selling it back to us in four colors.\" The pump house is now a door that opens at 4 a.m. Say so out loud. Players remember a door.\n" +
        "**The doors you didn't use.** After the file, before the bowls are empty, walk the table back through the plant. Name two ways in they never tried and one way to the file they walked past: the gold caps in the fridge, the binder in the desk, the ladder on the sign. Don't make it a lesson. Make it the story the next crew at this counter will hear about them. A job that felt rigged and turns out to have had a door in every wall is the job players come back for." },
      { kind: "table", name: "Who's the Client?",
        lead: "The posting never says. Pick one, or roll a d6.",
        columns: ["d6", "Client", "What They Do With It", "How They Show Their Face"],
        rows: [
          ["1 to 2", "A rival vat farm in Lantern Bay", "Undercuts Lonely Mouth by a cent a cube, grown on a different well under a different neighborhood.",
            "Three weeks later: Harborline Bites, \"made with Lantern Bay's pure aquifer water.\" Somebody else's block, drinking it now."],
          ["3 to 4", "Kindred", "Buys the wellhead's rights out from under Fullwell. Kindred doesn't sell water. It wants to know what Sumpside has been drinking.",
            "A woman in a soft grey coat at the noodle stand: \"We bought the wellhead. Thank you for the survey work.\" A clinic card on the counter."],
          ["5 to 6", "The Sump Rats, through a proxy", "They passed the hat, posted it through a proxy, and couldn't take the job themselves. Nobody told Undertow which crew would answer. If a card player sold the crew out in Scene 2, that was one Sump Rat's side money, and Undertow deals with it. If the crew already gave Undertow a copy, Undertow pays anyway, and laughs about it for a week.",
            "Silt, the next night: \"Undertow says come by.\" Undertow, holding the valve wheel to stay upright: \"Sit down. Deal them in.\""]
        ], strong: [0, 1] },
      { kind: "section", name: "What It Leaves", text:
        "- **Pay.** As above. Gear stripped from the troopers fences at the usual rates, less because it's branded Fullwell and very recently stolen.\n" +
        "- **Heat.** +1 with Fullwell for the chase, +1 more if it ended in a crash, casualties, or property nobody can ignore. It comes due at the next Downtime's Heat check. The Player's Handbook and the Game Master's Toolkit cover what Heat brings to the door.\n" +
        "- **The tunnel.** If the crew came in by the tunnel and Fullwell knows it was robbed, the grate gets welded shut and the pump house gets a visit. The Sump Rats pay for it.\n" +
        "- **Milestone.** A Hard Contract is a Major Milestone. Two of those and the crew reaches Level 2.\n" +
        "- **Hooks.** Undertow's Profile of the crew, and Odette's. Tomasz Quill, two years from a pension and now explaining to a supervisor what happened on his shift. And a wellhead under Hollow Bend that somebody is going to fight over. What the line workers know about the product and won't eat. And, if Ledger left a trail on the server, an analyst at Fullwell with a signature and a month to match it." },
      { kind: "section", name: "Loose Ends", text:
        "One line each for the people this job touched, for the next time the crew walks past.\n" +
        "- **Tomasz Quill,** a week later in a South Sprawl bar: \"They moved me to days. Days. Eleven years.\" Pen click, three times. \"Pension's still on. So I guess I owe somebody. I just don't know who.\"\n" +
        "- **Marisol Tan,** if they were honest with her, through Restock's route: \"Line lead says thanks. Line lead says the yellow press is broken now, and nobody can figure out why.\"\n" +
        "- **Cassia Moor,** if she hears what was in the file: \"I asked a question with a well in it. Somebody finally answered.\"\n" +
        "- **Nalo Fenwick:** a new photograph on the shelf above the dryer. A tree. No caption.\n" +
        "- **Officer Ines Doan,** if she saw them at the gate: nothing. Not yet." },
      { kind: "section", name: "After the Run", text:
        "This is a playtest copy. It's still being built, and your table is part of the crew building it. When the session ends and everyone is still arguing, write it down. The arguments are the useful part. Bring back answers to these:\n" +
        "1. Which rule did you look up more than once?\n" +
        "2. Which roll felt wrong: too easy, or too cruel?\n" +
        "3. What did nobody pick, and why not?\n" +
        "4. When did the table laugh, and when did it go quiet?\n" +
        "5. What broke? Give the page, the rule, what you expected, and what happened.\n" +
        "Bring these notes to the Elysium Nights Discord at discord.gg/b369vdP4QW, or email them to playtest@playelysiumnights.com." }
    ] },

    /* ---- RUN / THE TABLE: RUNNING IT SOLO ---------------------------------------- */
    { key: "solo", title: "Running It Solo", tag: "ONE GM, ONE FREELANCER · ABOUT THREE HOURS", blocks: [
      { kind: "prose", text:
        "One GM, one Freelancer. About three hours.\n" +
        "Odette doesn't care how many names are on the sheet. The plant doesn't either. The Fifth Flavor runs with one Freelancer at the counter, and most of it runs exactly as written: the legwork, the Sit-Down, the timeline, the hazards, the file. What changes is the arithmetic. One Freelancer has one set of Actions against a night shift, nobody to drag them behind the vat, and nobody to tilt the chase while they run. These rules cover those gaps. Anything they don't name runs as printed.\n" +
        "**Who to play.** Any of the five can take the job, but it ends at a server, so Ledger is the easiest first solo night. Every Freelancer has a way in; see Scene 3." },
      { kind: "table", name: "The Budget",
        lead: "At Caliber 1, one Freelancer's Fair Fight is 100 XP, a Milk Run is 50, and a Hard Contract is 150.",
        columns: ["Scene", "As Written", "Solo"],
        rows: [
          ["2: If it goes sideways", "Six Sump Rat Pump Crew (150)", "Two Sump Rat Pump Crew (50), a Milk Run"],
          ["3: The Night Shift", "Quill, four Riot Troopers, the Spotter Drone (375)", "One Riot Trooper and the Spotter Drone (75). Quill stays in the booth and doesn't come down to fight. He still walks down for the 2:00 check-in."],
          ["4: Capture at Lead 0", "Doan and Pryce (300)", "Doan alone (150), a Hard Contract. Pryce guards the car."]
        ], strong: [0],
        after: "The XP left under the Fair Fight line is deliberate. It belongs to the room: the presses, the syrup, the foam, and the pallet canyon hit troopers as hard as anyone. Point at them." },
      { kind: "section", name: "A Second Pair of Hands", text:
        "A solo Freelancer gets one ally for the night. The ally doesn't fight, doesn't make attack rolls, and takes damage only when the story says so. Once per scene, the ally helps: +2 to one of the Freelancer's d20 rolls, or 1 Edge Die on a pool. No roll. In Scene 4, the ally can tilt the chase once.\n" +
        "- **Scenes 1 and 2: the Ferryman.** The man on the other stool slides over once Odette is done. He offers to carry the second bowl and anything else that needs carrying, for a favor owed later. He doesn't say which favor. Write it down.\n" +
        "- **Scene 2 on: Silt.** If Undertow breaks and hands over the key, Silt takes over and walks the tunnel with the Freelancer. If not, the Ferryman stays, and he knows the staff door better than he should." },
      { kind: "section", name: "Scene by Scene", text:
        "- **Legwork.** Pick two threads and roll both. The other two still have faces; they just weren't asked tonight. If neither thread was the way in, Odette's two taps on the counter point at the Sump Rats as written.\n" +
        "- **The Sit-Down.** Runs as written. It was always one conversation. Undertow's warning still lands on the second Intimidation: the third stands up two Sump Rats, not half the room.\n" +
        "- **The Plant.** Quill stays in the security booth with his coffee. He talks on the radio the whole time, and his lines work as printed. He comes down the stair to fight only when the response clock reaches 2, and by then the Freelancer should already be leaving. He can still be talked down from the booth, over the radio, with the same Persuasion check. Restock's 2:05 window matters more alone: a Freelancer who crosses the floor while the drone charges may not have to fight at all. Marisol and Forklift Jerry run as written, and a solo Freelancer who is honest with Marisol has the floor to themselves.\n" +
        "- **Out the Back.** The Freelancer runs and sets the pace. Each round they can also try one tilt, but in a round they tilt, their Chase Check takes Snag. The ally's one tilt comes on top of that, whenever the GM likes the moment. Starting Lead, the route, the traffic drone, and both endings run as written.\n" +
        "- **Payday.** The Freelancer takes the crew's whole share: 𝒢1,800 after the Exchange's cut, or 𝒢1,950 if Odette went to 𝒢2,600. The Heat and the Milestone run as written. So does the noodle stand. Mother Ash sets down one bowl, then a second one nobody ordered." },
      { kind: "section", name: "Going Down Alone", text:
        "Nobody is there to stabilize a solo Freelancer, so this job doesn't kill one. If the Freelancer would drop to 0 Wounds in Scene 2, Scene 3, or Scene 4, they fall Unconscious but don't start Dying.\n" +
        "In Scene 2 they wake with 1 Wound and 1 Vitality at the shore end of the gangway, soaked, with the key still around Undertow's neck. The tunnel is shut to them. The staff door isn't. In Scene 3 or 4 they wake up with 1 Wound and 1 Vitality, zip-tied to the stair rail in the security booth or across the back seat of the sedan, while Quill or Pryce explains to the radio that nobody is paid enough for a body. That's a capture. The no-Heat clause is broken, and the job is now getting out. Quill can be talked down. Pryce can be bored into a mistake." }
    ] },

    /* ---- RUN / THE TABLE: THE GM'S CARD -------------------------------------------- */
    { key: "card", title: "Quick-Start GM's Card", tag: "THE NUMBERS ON ONE PAGE", blocks: [
      { kind: "note", text: "The Quick-Start booklet's GM's Card: the numbers this job runs on, on one page." },
      { kind: "table", name: "DCs on the Fly",
        columns: ["Very Easy", "Easy", "Standard", "Hard", "Very Hard", "Nearly Impossible"],
        rows: [["5", "10", "15", "20", "25", "30"]] },
      { kind: "table", name: "d20 Margin",
        columns: ["Margin", "Result"],
        rows: [
          ["+10", "Flawless: plus a bonus"],
          ["+5 to +9", "Standard: clean"],
          ["0 to +4", "Costly: spend something in the scene"],
          ["-1 to -4", "Failure: lose ground"],
          ["-5 or worse", "Critical Failure: it backfires"]
        ], strong: [0],
        after: "Edge / Snag: 2d20, keep higher / lower. Cancel 1 for 1. Never more than 2d20." },
      { kind: "table", name: "Dice Pools",
        columns: ["Risk", "Snag", "Flat DC"],
        rows: [
          ["Easy", "1", "10"],
          ["Moderate", "2", "15"],
          ["Hard", "3", "20"],
          ["Daunting", "4", "25"],
          ["Nearly Impossible", "5", "30"]
        ], strong: [0],
        after: "Each d10: 1 to 5 nothing, 6 to 9 one, 10 two. Margin = successes - failures. +3 Flawless, +1 to +2 Costly, 0 Mixed (a cost that follows them), -1 to -2 Failure, -3 Critical Failure. Untrained: +2 Snag Dice." },
      { kind: "table", name: "The Round",
        lead:
        "Initiative: d20 + Caliber + Agility or Wits. Turn: Action, Move (or a Swift, or a second Impulse), Free stuff. One Impulse per round off-turn. Complex uses Action and Move.\n" +
        "Attack: melee d20 + Body + Weapon Prof; ranged d20 + Agility + Weapon Prof; vs Defense. Ranged with an enemy adjacent: Snag. Natural 20: at least a Strong Hit.",
        columns: ["Margin", "Result"],
        rows: [
          ["+10", "Dominant Hit: +1d6 or a strong effect"],
          ["+5 to +9", "Strong Hit: a condition if earned"],
          ["0 to +4", "Standard Hit"]
        ], strong: [0],
        after: "Damage: 1. Hit (dice + the attack's Attribute). 2. One Active Defense. 3. Armor DR (physical only), then Resistance or Vulnerability. 4. Vigor, then Vitality, then Wounds." },
      { kind: "table", name: "The Room",
        lead: "Half Cover +2, Three-Quarter Cover +5, Total Cover: no line of sight. Difficult Terrain: 2 Speed a space. Falling: 1d6 per 2 spaces.",
        columns: ["Material", "Fragile", "Cheap", "Average", "Heavy", "Fortified"],
        rows: [
          ["Structure", "5", "7", "9", "11", "14"],
          ["Integrity", "3", "8", "12", "18", "24"]
        ], strong: [0] },
      { kind: "table", name: "Response Clock",
        columns: ["Site", "Soft", "Working", "Hardened", "Black"],
        rows: [["First response", "8 to 10 rounds", "5 to 6 rounds", "3 to 4 rounds", "2 rounds"]], strong: [0],
        after:
        "Start it when a fight goes loud at a site with an owner, and tell the players you started it. Jump ahead every 3 loud rounds, or at once when a Node gets an Alert out. In The Fifth Flavor, the Dispatch lines in Scene 3 are the clock.\n" +
        "Alarm: a look, a search, the clock. Small mistakes make them look; only five things start the clock." },
      { kind: "table", name: "Nodes",
        columns: ["Tier", "SR", "Cipher Save", "Integrity"],
        rows: [
          ["Rudimentary [-1]", "10", "+3", "none"],
          ["Standard [0]", "12", "+4", "none"],
          ["Improved [1]", "14", "+5", "20"],
          ["Advanced [2]", "16", "+6", "30"]
        ], strong: [0],
        after: "Standard Firewall: +2 Security, Damage Threshold 2. A resisted cipher (a failed attack or a made save) fires one IC response, your pick: Basic IC Alert; Advanced IC Alert or Analyze (+2 Cipher Saves against that hacker, stacking). No IC, no response. Every Alert starts the response clock, then the Node's own Alert result happens too." },
      { kind: "rule", name: "Chases", text:
        "Lead 0 Contact, 1 / 2 Close (6 / 12 spaces), 3 / 4 Distant (24 / 48), 5 Escape; start at 2. Quick Hacks reach through Close only. Contested Chase Check each round: winner moves Lead 1, or 2 by winning by 5+. Tie: Stalemate, roll a hazard. One tilt per round (Edge or Snag). System Hits move Lead 1, once per round; a crit on the vehicle can be one. On foot: d20 + Agility + Athletics or Acrobatics; the route (Scene 4) says who rolls with Edge on each stretch." },
      { kind: "rule", name: "The Sit-Down", text:
        "Resolve: Pushover 3, Standard 5, Hardened 8, Iron 12, Apex 16+. Each Round, everyone makes one Play: Press, Read, Support, Disrupt, or Hold. Helpers add up to 3 Edge Dice. Press: Flawless 3 Pressure, Costly 2, Mixed 1 and Social Fallout, Failure 0, Critical Failure 0 and the target gains 1 Resolve.\n" +
        "Postures, one a Round: Deflect or Compose takes 1 off. Stonewall takes 2 off, then Cornered. Counter is a contested roll. Weak spot: take the Posture off first, then double what's left." },
      { kind: "table", name: "Who's at the Table",
        columns: ["Freelancer", "Def", "DR", "Vit", "Wnd", "PP", "Also"],
        rows: [
          ["Gantry", "13", "3", "15", "16", "15", ""],
          ["Ledger", "13", "1", "7", "12", "7", ""],
          ["Sunday", "12", "1", "9", "16", "13", ""],
          ["Copper", "13", "1", "9", "12", "14", "can't be Surprised"],
          ["Tinsel", "12", "1", "7", "12", "8", "slips restraints"]
        ], strong: [0] }
    ] }
  ]
};
