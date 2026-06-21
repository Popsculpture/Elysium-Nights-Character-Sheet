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
    feature: { name: "Flashing the Tin", text: "You know the patrol routes, radio codes, and shift changes of corporate and municipal security. You can usually access low level restricted areas or get a minor infraction overlooked by acting like you still belong to the force, provided you do not push your luck or draw a weapon. Current officers might give you the benefit of the doubt over a civilian." },
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
    feature: { name: "Boardroom Etiquette", text: "You know how to walk, talk, and dress like you own the building. You can freely walk into the lobbies, cafeterias, and low security floors of most corporate offices without being questioned by security or receptionists, as long as you look the part and act like you have a meeting to attend." },
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
    feature: { name: "Ghost in the Logs", text: "You know the default passwords and common lazy backdoors left by tired system administrators. When accessing public or low security terminals, you can often find hidden directories, developer notes, or bypass basic digital locks without needing to roll. The local digital underground treats you as a known and respected entity." },
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
    feature: { name: "Press Pass", text: "You know how to bypass gatekeepers. Bouncers, receptionists, and low level security are more likely to let you into press areas, crime scenes, or corporate lobbies if you confidently claim you are following a lead. Whistleblowers and nervous sources inherently trust you to protect their anonymity." },
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
    feature: { name: "Ghost Routes", text: "You instinctively memorize the blind spots in the city's surveillance and border checkpoints. You can almost always find a path for yourself and a small group to move between adjacent districts without being recorded by standard traffic cameras, automated sensors, or routine patrols." },
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
    feature: { name: "Street Pharmacist", text: "You can instantly identify the chemical makeup, purity, and street value of almost any illicit substance or common pharmaceutical by sight, smell, or taste without needing to make a check. Local black market chemists and street level users will generally grant you a neutral audience." },
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
    feature: { name: "Colors and Codes", text: "You understand the unwritten rules of the street. You can automatically identify gang territories, active turf wars, and the meaning behind specific graffiti tags or tattoos. Lower ranking gang members and unaffiliated street kids will typically treat you with cautious respect rather than immediate hostility." },
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
    feature: { name: "Junkyard Dog", text: "You know exactly where to find cheap, discarded, or overlooked hardware. You can usually scrounge up basic replacement parts, scrap metal, or functional low tier tools from alleyways, abandoned vehicles, or local chop shops without spending any money, provided you have a few hours to search." },
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
    feature: { name: "Velvet Rope", text: "You are a known face in the city's nightlife. You and your crew can bypass lines, cover charges, and low level scrutiny at most standard clubs, bars, and lounges. Bouncers, bartenders, and venue staff will usually share minor local gossip with you if you ask nicely." },
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
    feature: { name: "Concrete Oasis", text: "You know the hidden architecture of the city. You can always find a safe, dry, and hidden place for your crew to rest in urban ruins, abandoned zones, or fringe blocks. Local squatters and fringe communities will usually share a meal or basic local news with you rather than driving you out." },
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
    feature: { name: "Professional Courtesy", text: "You know the unspoken etiquette of the mercenary underworld. You can easily find the local safe bars, weapon fences, or neutral ground fixers in a new district. Other professional muscle will generally treat you with mutual respect and avoid starting unnecessary fights with you in neutral territory." },
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
    feature: { name: "Shift Worker's Solidarity", text: "You blend perfectly into the background of the working class. Service workers, janitors, and retail clerks will often ignore you if you are somewhere you should not be, assuming you are just another tired employee on a bad shift. You can also easily listen in on unfiltered workplace gossip without raising suspicion." },
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
    feature: { name: "Nomad's Network", text: "You know the smuggling routes and hidden rest stops outside the city limits. You can secure safe passage or a temporary hideout with outlaw crews, drifters, and smugglers, provided you do not bring corporate security or the law down on their heads." },
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
    feature: { name: "Backstage Pass", text: "You know the local underground music scene inside and out. You can secure entry to underground shows, raves, or private venue backrooms. Independent artists and their hardcore fans view you favorably and might hide you if you are running from authorities or corporate security." },
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
    feature: { name: "Dockside Fraternity", text: "You are part of the tight knit community that keeps orbit running. Dockworkers, shuttle pilots, and orbital mechanics will generally offer you a drink and a place to lay low. You can freely access standard commercial launch pads and hangar bays without raising suspicion." },
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
    feature: { name: "Faded Star", text: "You still have a few loyal fans who remember your peak. Once per session, you can rely on a fan, paparazzi, or former admirer you run into on the street to grant you a minor favor, such as creating a distraction, offering a free ride, or letting you borrow a burner comm, just for the thrill of being near you." },
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
    feature: { name: "Thin Places", text: "You have an innate sense of the city's spiritual architecture. You can easily locate the nearest rooftop shrine, dead zone, or quiet place where the Flow is calmest. Seekers, street mystics, and urban monks will offer you cryptic advice and safe harbor in these places." },
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
    feature: { name: "The Hippocratic Underground", text: "The street respects the people who stitch it back together. You are generally considered neutral territory by local gangs and syndicates. Unless you are actively causing harm, most criminals will let you pass unharmed, and you can easily access underground black market clinics and ripperdoc lounges to ask questions." },
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
    feature: { name: "Red Tape Navigator", text: "You know exactly how municipal and corporate bureaucracy works. You know the exact forms to file, lines to stand in, and clerks to bribe to get public records, zoning permits, or architectural blueprints without drawing attention to yourself or leaving a digital footprint." },
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
    feature: { name: "Academic Privilege", text: "You speak the language of corporate labs and university research. You can gain free access to public university archives, corporate libraries, and academic databases. Other scientists, technicians, and researchers will often talk shop with you, occasionally revealing non classified project details they wouldn't share with the press." },
    contacts: "Choose two research contacts, such as a former supervisor, a colleague who left for black market work, or a scientist who quietly doubts their employer.",
    hooks: [
      "The prototype you helped build, and the first time you realized it was not safe.",
      "The credit that got stolen from you, and the patent, paper, or log that proves it.",
      "The ethics line you drew, and the moment the lab stepped over it without you."
    ],
    personalItem: "A fragment of an experimental chip, a cracked safety lens, or a core from a prototype that never shipped."
  }
];
