window.EN = window.EN || {};
EN.backgrounds = [
  {
    key: "badge",
    name: "Badge",
    blurb: "You used to be part of the system that keeps the city from tearing itself apart, or at least pretends to. You wore the badge, the logo, the armband, and learned how authority moves through radios, reports, and quiet favors. You know the rhythms of patrol shifts, the way a supervisor thinks when something goes sideways, and how quickly procedure bends under pressure. Even if you left on bad terms, that training never leaves you. The badge might be dead, but the instincts are not.",
    skills: {
      granted: ["Intuition"],
      choose: { count: 1, options: ["Perception", "Investigation"] }
    },
    proficiencies: [
      "Tools: Choose one (Security Tools, Investigation Tools)",
      "Weapon/Vehicle: Choose one (Sidearms, Ground Vehicles)"
    ],
    contacts: "Choose two contacts tied to your past, such as a former partner, an internal affairs analyst, or a retired dispatcher.",
    hooks: [
      "The call you answered by the book, and the one you handled off the record.",
      "The supervisor who still texts you for favors, and the one who wants you buried.",
      "The escalation ladder you memorized, and the time you climbed it too far."
    ],
    personalItem: "An old badge, commendation ribbon, or credential card. It does not open doors anymore, but it reminds you of what you swore to do."
  },
  {
    key: "boardroom-exile",
    name: "Boardroom Exile",
    blurb: "You learned how power really moves. Not through speeches or titles, but through budgets, approvals, and who owes whom a favor. You can read a room the way others read a threat display, spotting leverage before it becomes obvious. Whether you walked away or were pushed out, you still understand the game. The system never forgets you completely, and you never forget how to play it.",
    skills: {
      granted: ["Persuasion"],
      choose: { count: 1, options: ["Intuition", "Deception"] }
    },
    proficiencies: [
      "Tools: Choose one (Bureaucracy Tools, Systems Tools)",
      "Weapon/Vehicle: Choose one (Sidearms, Ground Vehicles)"
    ],
    contacts: "Choose two corporate contacts, such as a mid level manager, an assistant who actually runs the place, or legal counsel who owes you.",
    hooks: [
      "The approval you pushed through that changed everything, and who it hurt.",
      "The executive who taught you the game, and the meeting where they made you the fall guy.",
      "The leverage file you still have, and the reason you have not used it."
    ],
    personalItem: "An obsessively kept card case from your former life. You still run your thumb over the flawless embossing of the subtle off-white cards, feeling their tasteful thickness despite the watermark of the company that pushed you out."
  },
  {
    key: "cipher-punk",
    name: "Cipher Punk",
    blurb: "You learned the city by slipping through its veins. Firewalls, access logs, legacy code, and poorly patched systems were your neighborhoods. Maybe you did it for ideals, maybe for money, maybe because you could not stop yourself. You know how systems lie, how admins get lazy, and how the same few mistakes repeat everywhere.",
    skills: {
      granted: ["Systems"],
      choose: { count: 1, options: ["Investigation", "Deception"] }
    },
    proficiencies: [
      "Tools: Choose one (Systems Tools, Investigation Tools)",
      "Weapon/Vehicle: Choose one (Simple Weapons, Ground Vehicles)"
    ],
    contacts: "Choose two tech contacts, such as an old collective member, a code archivist, or a lightly crooked sysadmin.",
    hooks: [
      "The system you cracked because you could, and what you found inside it.",
      "The handle you retired, and who keeps using it to frame you.",
      "The admin who almost caught you, and the quiet deal that followed."
    ],
    personalItem: "A battered deck, drive, or interface rig loaded with obsolete code that you cannot bear to wipe."
  },
  {
    key: "click-chaser",
    name: "Click Chaser",
    blurb: "You chased truth the hard way through half drunk sources, corrupted files, and stories that did not want to be told. You learned how to sort signal from noise, when a leak is bait, and when silence is the loudest answer you are going to get. You know how power reacts when it is exposed, and you still carry the weight of the stories that changed lives.",
    skills: {
      granted: ["Athletics"],
      choose: { count: 1, options: ["Acrobatics", "Perception"] }
    },
    proficiencies: [
      "Tools: Choose one (Media Tools, Fieldcraft Tools)",
      "Weapon/Vehicle: Choose one (Ground Vehicles, Simple Weapons)"
    ],
    contacts: "Choose two media contacts, such as a stringer on your beat, a whistleblower inside a corp, or a bored editor who still answers your calls.",
    hooks: [
      "The story you published that made you famous, or made you a target.",
      "The leak that was bait, and the person you burned chasing it.",
      "The source who vanished, and the message they left you with."
    ],
    personalItem: "A worn press pass, old audio recorder, or a printed copy of the best article you ever wrote."
  },
  {
    key: "courier",
    name: "Courier",
    blurb: "You live between checkpoints, schedules, and blind spots. You learned which cameras are real, which guards are bored, and which routes only work once. Whether you moved packages, people, or information, you made a career out of not being memorable. The city taught you that borders are suggestions enforced by habit, and habit can be broken.",
    skills: {
      granted: ["Acrobatics"],
      choose: { count: 1, options: ["Athletics", "Intuition"] }
    },
    proficiencies: [
      "Tools: Choose one (Fieldcraft Tools, Systems Tools)",
      "Weapon/Vehicle: Choose one (Ground Vehicles, Aerial Vehicles)"
    ],
    contacts: "Choose two route contacts, such as a port clerk, a neighborhood guide, or a rival courier.",
    hooks: [
      "The run that went wrong at the last checkpoint, and how you escaped.",
      "The package you refused to deliver, and who has not forgiven you.",
      "The route you invented that only works once, and the reason you still need it."
    ],
    personalItem: "A stamped token, a set of keys to a vehicle you no longer own, or a heavily annotated physical map."
  },
  {
    key: "dealer",
    name: "Dealer",
    blurb: "You learned the economy that does not show up in reports. Product changes hands in parking garages, clinics, and half lit rooms where everyone smiles too much. You learned how to test, cut, verify, and walk away when something smells wrong. The trade taught you that trust is temporary, and survival is about reading people faster than they read you.",
    skills: {
      granted: ["Medtech"],
      choose: { count: 1, options: ["Persuasion", "Systems"] }
    },
    proficiencies: [
      "Tools: Choose one (Medical Tools, Bureaucracy Tools)",
      "Weapon/Vehicle: Choose one (Sidearms, Simple Weapons)"
    ],
    contacts: "Choose two trade contacts, such as a cautious supplier, a clinic tech who buys off the books, or a rival dealer you sometimes partner with.",
    hooks: [
      "The batch you will not touch anymore, and what it did to someone you knew.",
      "The buyer you misread, and the price you paid for it.",
      "The supplier who kept you alive, and the leverage they still hold."
    ],
    personalItem: "A lucky chip, coin, or a hollowed out credstick from a deal that should have gone bad."
  },
  {
    key: "ganger",
    name: "Ganger",
    blurb: "You grew up with lines drawn in paint, blood, and memory. Your crew was safety and pressure all at once, a family that demanded loyalty and paid in protection or pain. You learned how territory really works, who actually makes decisions, and how fast a situation turns lethal when respect slips. Even if you left the life behind, the street still recognizes you.",
    skills: {
      granted: ["Intuition"],
      choose: { count: 1, options: ["Athletics", "Stealth"] }
    },
    proficiencies: [
      "Tools: Choose one (Infiltration Tools, Security Tools)",
      "Weapon/Vehicle: Choose one (Sidearms, Simple Weapons)"
    ],
    contacts: "Choose two gang related contacts, such as a lieutenant, a neutral go between, or a community elder.",
    hooks: [
      "The colors you used to wear, and the rule you broke that made you stop.",
      "The rival who knows your real name, and the friend you left behind on that block.",
      "The territory line you crossed for love, pride, or survival."
    ],
    personalItem: "A tagged jacket, a patched bandana, or a photograph of the crew from before things fell apart."
  },
  {
    key: "gearhead",
    name: "Gearhead",
    blurb: "You are the reason broken things keep moving. You learned to fix machines with bad parts, worse documentation, and no time. Elevators, drones, generators, cyberware, vehicles, if it hums or sparks, you have probably cursed at it. You trust systems you can open more than promises you cannot.",
    skills: {
      granted: ["Engineering"],
      choose: { count: 1, options: ["Athletics", "Systems"] }
    },
    proficiencies: [
      "Tools: Choose one (Engineering Tools, Systems Tools)",
      "Weapon/Vehicle: Choose one (Industrial / Mechs, Ground Vehicles)"
    ],
    contacts: "Choose two hardware contacts, such as a scrapyard owner, a parts runner, or an old foreman.",
    hooks: [
      "The patch job that saved a crew, and the next failure that haunts you.",
      "The machine you rebuilt from scrap, and the person who claims you stole it.",
      "The part you cannot source anymore, and the promise you made anyway."
    ],
    personalItem: "A grease stained notebook or a perfectly weighted wrench that you refuse to use for actual labor."
  },
  {
    key: "glow-idol",
    name: "Glow Idol",
    blurb: "You worked spaces where attention is currency and safety is something you negotiate in real time. You learned how to read rooms, steer conversations, and turn charm into leverage without making it obvious. People talked around you, underestimated you, or forgot you were listening. You survived on intuition and presentation, knowing exactly when to lean in and when to disappear.",
    skills: {
      granted: ["Persuasion"],
      choose: { count: 1, options: ["Perception", "Deception"] }
    },
    proficiencies: [
      "Tools: Choose one (Glamour Tools, Infiltration Tools)",
      "Weapon/Vehicle: Choose one (Sidearms, Ground Vehicles)"
    ],
    contacts: "Choose two contacts from your prior venues, such as a corporate client, a mid tier fixer, or a club manager who trusts your instincts.",
    hooks: [
      "The regular who thought they owned you, and how you proved they did not.",
      "The secret you overheard that could ruin someone powerful, and why you kept it.",
      "The night you disappeared mid shift, and who still asks about you."
    ],
    personalItem: "A coded journal, an engraved lighter, or an empty perfume bottle from a very expensive client."
  },
  {
    key: "homesteader",
    name: "Homesteader",
    blurb: "When systems failed or never arrived, you built something anyway. You learned to grow food where it should not grow, route water where it should not flow, and keep people alive with whatever was on hand. Rooftops, fringe zones, and forgotten blocks became home because you made them work. You know the value of practical things, shared labor, and quiet resilience.",
    skills: {
      granted: ["Athletics"],
      choose: { count: 1, options: ["Perception", "Engineering"] }
    },
    proficiencies: [
      "Tools: Choose one (Fieldcraft Tools, Engineering Tools)",
      "Weapon/Vehicle: Choose one (Simple Weapons, Industrial / Mechs)"
    ],
    contacts: "Choose two community contacts, such as a neighbor organizer, a supply broker, or a local utility insider.",
    hooks: [
      "The rooftop, lot, or fringe block you turned into home, and who wants it back.",
      "The resource you figured out how to pull from nothing, and the price of doing it.",
      "The storm, blackout, or crackdown that proved the city can forget you overnight."
    ],
    personalItem: "A battered multi tool, a sealed packet of heritage seeds, or a hand tested water filter."
  },
  {
    key: "hired-gun",
    name: "Hired Gun",
    blurb: "You learned to live by contracts and exit plans. Whether you hunted bounties, guarded assets, or retrieved things that did not want to be found, you worked for pay and survival. You learned how targets think, how clients lie, and how fast situations spiral when money is involved. You trust preparation over bravado and silence over promises.",
    skills: {
      granted: ["Athletics"],
      choose: { count: 1, options: ["Perception", "Intuition"] }
    },
    proficiencies: [
      "Tools: Choose one (Security Tools, Medical Tools)",
      "Weapon/Vehicle: Choose one (Longarms, Heavy Weapons)"
    ],
    contacts: "Choose two professional contacts, such as a fixer, a dispatcher, or a former client.",
    hooks: [
      "The contract that paid too well, and the clause you did not see coming.",
      "The target you could have taken, and the reason you let them walk.",
      "The client who still owes you, and the person who wants you erased instead."
    ],
    personalItem: "A battered token from a contract you barely survived, or a casing from a shot you regret taking."
  },
  {
    key: "minimum-wage-mage",
    name: "Minimum Wage Mage",
    blurb: "You survived something that should have killed you and came back Flow touched, with resonance humming under your skin. But progress never stops, so you went right back to your shift, your queues, your scripts, and the polite misery of a job that pays just enough to keep you showing up. You learned to nudge the current in small ways to keep systems moving and people calm.",
    skills: {
      granted: ["Esoterica"],
      choose: { count: 1, options: ["Awareness", "Sleight"] }
    },
    proficiencies: [
      "Tools: Choose one (Ritual Implements, Bureaucracy Tools)",
      "Weapon/Vehicle: Choose one (Simple Weapons, Ground Vehicles)"
    ],
    contacts: "Choose two people from your working life, such as a coworker, a shift manager, or a regular who knows too much.",
    hooks: [
      "The incident that Flow touched you, and the co worker who saw too much.",
      "The tiny harmless trick you use at work, and the day it backfired hard.",
      "The bill, policy, or manager that pushed you to weaponize your gift."
    ],
    personalItem: "A cheap, mass produced uniform nametag or a breakroom coffee mug that somehow survived your awakening."
  },
  {
    key: "outrider",
    name: "Outrider",
    blurb: "You live outside rules that never served you. Laws, contracts, and borders are things you navigate, not things you obey. You learned to trust your own code because everything else came with strings attached. Whether you ran contraband, dodged warrants, or simply refused to settle, movement kept you alive.",
    skills: {
      granted: ["Perception"],
      choose: { count: 1, options: ["Stealth", "Athletics"] }
    },
    proficiencies: [
      "Tools: Choose one (Fieldcraft Tools, Medical Tools)",
      "Weapon/Vehicle: Choose one (Ground Vehicles, Industrial / Mechs)"
    ],
    contacts: "Choose two outlaw contacts, such as a driver, a fence, or a tunnel runner.",
    hooks: [
      "The rule you refused to follow, and the warrant, contract, or bounty that followed.",
      "The crew you rolled with once, and the line you would not cross for them.",
      "The place you cannot return to, and the person waiting there anyway."
    ],
    personalItem: "A spent bullet, a broken shackle, or a cut off ID tag kept as a reminder of what you escaped."
  },
  {
    key: "rocker",
    name: "Rocker",
    blurb: "You learned how sound moves people. Small rooms, street corners, and improvised stages taught you how to pull a crowd together and aim them like a weapon or a shield. Music was protest, survival, and community all at once. Even without an instrument in your hands, you still know how to make people listen.",
    skills: {
      granted: ["Persuasion"],
      choose: { count: 1, options: ["Acrobatics", "Intuition"] }
    },
    proficiencies: [
      "Tools: Choose one (Media Tools, Glamour Tools)",
      "Weapon/Vehicle: Choose one (Simple Weapons, Sidearms)"
    ],
    contacts: "Choose two scene contacts, such as a venue owner, a protest organizer, or a street photographer.",
    hooks: [
      "The song that started a riot, and the person who got blamed for it.",
      "The venue that banned you, and the corporate suit who made the call.",
      "The fan who needed you, and the night you chose the crowd over them."
    ],
    personalItem: "A sticker layered instrument case, a patched jacket, or a broken drumstick from your best show."
  },
  {
    key: "spacer",
    name: "Spacer",
    blurb: "You learned how fragile everything is when there is nothing beneath your feet. Vacuum, microgravity, and long stretches of isolation teach habits that never fully go away. You learned to trust tethers, check seals twice, and fix things where failure means drifting forever. Space leaves its mark, even after you come home.",
    skills: {
      granted: ["Engineering"],
      choose: { count: 1, options: ["Awareness", "Systems"] }
    },
    proficiencies: [
      "Tools: Choose one (Engineering Tools, Fieldcraft Tools)",
      "Weapon/Vehicle: Choose one (Starcraft, Aerial Vehicles)"
    ],
    contacts: "Choose two spacer contacts, such as a dockmaster, a tug pilot, or a salvage operator.",
    hooks: [
      "The vacuum scare that rewired your instincts, and the sound you still remember.",
      "The ship, station, or crew you call family, and the reason you left.",
      "The salvage you brought home, and the quiet people who came asking for it."
    ],
    personalItem: "A mission patch, a chipped hull fragment, or a worn tether snap."
  },
  {
    key: "spotlight-survivor",
    name: "Spotlight Survivor",
    blurb: "For a while, your face meant something. People watched, judged, admired, or tore you apart from a distance. You learned how attention distorts reality, how praise becomes pressure, and how fast the crowd moves on. Even after the spotlight faded, you remember how to work it, and how dangerous it can be.",
    skills: {
      granted: ["Athletics"],
      choose: { count: 1, options: ["Stealth", "Perception"] }
    },
    proficiencies: [
      "Tools: Choose one (Media Tools, Medical Tools)",
      "Weapon/Vehicle: Choose one (Simple Weapons, Sidearms)"
    ],
    contacts: "Choose two fame related contacts, such as a former agent, a devoted fan, or a gossip blogger.",
    hooks: [
      "The moment you went viral, and the part of the story nobody saw.",
      "The sponsor, agent, or channel that owned your image, and what you did to break free.",
      "The rumor that still follows you, and the person who benefits from it."
    ],
    personalItem: "A clipped headline, an archived feed capture, or a faded poster from the height of your fame."
  },
  {
    key: "starhuffer",
    name: "Starhuffer",
    blurb: "You went looking for the real in the city's blank spaces. Rooftops, dead rails, little candle shrines, anywhere the sky can still reach you. You read the streetlights like false constellations and treat your birth chart like a map, learning to sit with discomfort until it turns into guidance. The city is loud, but you know where the veil thins and the stars come through.",
    skills: {
      granted: ["Awareness"],
      choose: { count: 1, options: ["Esoterica", "Intuition"] }
    },
    proficiencies: [
      "Tools: Choose one (Ritual Implements, Fieldcraft Tools)",
      "Weapon/Vehicle: Choose one (Simple Weapons, Starcraft)"
    ],
    contacts: "Choose two contemplative or occult contacts, such as a mentor, a fellow student, or a shrine caretaker.",
    hooks: [
      "The rooftop, shrine, or dead rail spot that feels like yours, and who keeps showing up there.",
      "The ritual, practice, or discipline you swear is harmless, and the sign that it is not.",
      "The mentor or fellow seeker who called you out, and the truth you cannot unhear."
    ],
    personalItem: "A worn bead string, a focus token, or a handmade talisman that brings you peace."
  },
  {
    key: "street-doc",
    name: "Street Doc",
    blurb: "You learned medicine where mistakes are immediate and forgiveness is rare. Back rooms, street clinics, and makeshift wards taught you triage over theory. You know how to work fast, improvise, and keep people alive with tools that were never meant for the job. The work is brutal, but it matters.",
    skills: {
      granted: ["Medtech"],
      choose: { count: 1, options: ["Perception", "Intuition"] }
    },
    proficiencies: [
      "Tools: Choose one (Medical Tools, Investigation Tools)",
      "Weapon/Vehicle: Choose one (Simple Weapons, Sidearms)"
    ],
    contacts: "Choose two medical ties, such as a street clinic operator, a morgue tech, or a ripperdoc.",
    hooks: [
      "The patient you could not save, and the person who blames you for it.",
      "The line you will not cross, and the night you came close anyway.",
      "The clinic, crew, or ripper with your number, and the favor they will demand."
    ],
    personalItem: "A stained manual, a sterile scalpel you never use, or an overlay full of hard won surgical notes."
  },
  {
    key: "wageslave",
    name: "Wageslave",
    blurb: "You worked inside the machine at the level nobody brags about. Tickets, queues, scripts, and training modules taught you how systems actually fail. You learned where processes slow down, who rubber stamps what, and how a single form can ruin someone's week. You know how to make the system hiccup when someone needs a break.",
    skills: {
      granted: ["Systems"],
      choose: { count: 1, options: ["Investigation", "Persuasion"] }
    },
    proficiencies: [
      "Tools: Choose one (Bureaucracy Tools, Investigation Tools)",
      "Weapon/Vehicle: Choose one (Simple Weapons, Ground Vehicles)"
    ],
    contacts: "Choose two office contacts, such as a coworker, a supervisor, or an IT tech who knows shortcuts.",
    hooks: [
      "The policy you enforced that still makes you cringe, and the person who remembers.",
      "The shortcut you discovered in the system, and the day you used it for revenge or mercy.",
      "The supervisor who loved the rules, and the incident that made you quit or snap."
    ],
    personalItem: "A lanyard of old badges and access cards that should have been deactivated years ago, or a 'World's Okayest Employee' desk plaque."
  },
  {
    key: "whitecoat",
    name: "Whitecoat",
    blurb: "You lived in labs where theory becomes reality. You built, tested, and documented things that were supposed to stay abstract until they did not. You learned how fragile innovation is, how quickly ethics get rewritten, and how often credit disappears into team effort. You still think in models and failure cases, because you know what happens when no one does.",
    skills: {
      granted: ["Engineering"],
      choose: { count: 1, options: ["Systems", "Investigation"] }
    },
    proficiencies: [
      "Tools: Choose one (Engineering Tools, Investigation Tools)",
      "Weapon/Vehicle: Choose one (Simple Weapons, Ground Vehicles)"
    ],
    contacts: "Choose two research contacts, such as a former supervisor, a colleague who left for black market work, or a scientist who quietly doubts their employer.",
    hooks: [
      "The prototype you helped build, and the first time you realized it was not safe.",
      "The credit that got stolen from you, and the patent, paper, or log that proves it.",
      "The ethics line you drew, and the moment the lab stepped over it without you."
    ],
    personalItem: "A fragment of an experimental chip, a cracked safety lens, or a core from a prototype that never shipped."
  }
];
