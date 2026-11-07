window.EN = window.EN || {};
/* `hooks`: the Player's Handbook prints ONE Backstory Hook for each of the ten launch
   Backgrounds (badge, boardroom-exile, cipher-punk, courier, dealer, ganger, gearhead,
   glow-idol, minimum-wage-mage, street-doc), so those carry one. The Freelancer's Companion's ten
   Backgrounds arrive with its pack (js/packs.js), in the same shape.
   `blurb`: the book's own words. The books dropped one flavor sentence from each Handbook blurb on 13 October; the app
   follows (author's ruling, 28 October 2026). */
EN.backgrounds = [
  {
    key: "badge",
    name: "Badge",
    blurb: "You used to be part of the system that keeps the city from tearing itself apart, or at least pretends to. You wore the badge, the logo, the armband, and learned how authority moves through radios, reports, and quiet favors. Even if you left on bad terms, that training never leaves you. The badge might be dead, but the instincts aren't.",
    skills: {
      granted: ["Intuition"],
      choose: { count: 1, options: ["Perception", "Investigation"] }
    },
    proficiencies: [
      "Tools: Choose one (Security Tools, Investigation Tools)",
      "Weapon/Vehicle: Choose one (Sidearms, Ground Vehicles)"
    ],
    feature: { name: "Flashing the Tin", text: "You know the patrol routes, radio codes, and shift changes of corporate and municipal security. You can usually access low-level restricted areas or get a minor infraction overlooked by acting like you still belong to the force, provided you don't push your luck or draw a weapon. Current officers might give you the benefit of the doubt over a civilian." },
    contacts: "Choose two contacts tied to your past, such as a former partner, an internal affairs analyst, or a retired dispatcher.",
    hooks: [
      "The supervisor who still texts you for favors, and the one who wants you buried."
    ],
    personalItem: "An old badge, commendation ribbon, or credential card. It doesn't open doors anymore, but it reminds you of what you swore to do."
  },
  {
    key: "boardroom-exile",
    name: "Boardroom Exile",
    blurb: "You learned how power really moves. Not through speeches or titles, but through budgets, approvals, and who owes whom a favor. You can read a room the way others read a threat display, spotting leverage before it becomes obvious. The system never forgets you completely, and you never forget how to play it.",
    skills: {
      granted: ["Persuasion"],
      choose: { count: 1, options: ["Intuition", "Deception"] }
    },
    proficiencies: [
      "Tools: Choose one (Bureaucracy Tools, Systems Tools)",
      "Weapon/Vehicle: Choose one (Sidearms, Ground Vehicles)"
    ],
    feature: { name: "Boardroom Etiquette", text: "You know how to walk, talk, and dress like you own the building. You can freely walk into the lobbies, cafeterias, and low-security floors of most corporate offices without being questioned by security or receptionists, as long as you look the part and act like you have a meeting to attend." },
    contacts: "Choose two corporate contacts, such as a mid-level manager, an assistant who actually runs the place, or legal counsel who owes you.",
    hooks: [
      "The leverage file you still have, and the reason you haven't used it."
    ],
    personalItem: "An obsessively kept card case from your former life. You still run your thumb over the flawless embossing of the subtle off-white cards, feeling their tasteful thickness despite the watermark of the company that pushed you out."
  },
  {
    key: "cipher-punk",
    name: "Cipher Punk",
    blurb: "You learned the city by slipping through its veins. Firewalls, access logs, legacy code, and poorly patched systems were your neighborhoods. You know how systems lie, how admins get lazy, and how the same few mistakes repeat everywhere.",
    skills: {
      granted: ["Systems"],
      choose: { count: 1, options: ["Investigation", "Deception"] }
    },
    proficiencies: [
      "Tools: Choose one (Systems Tools, Investigation Tools)",
      "Weapon/Vehicle: Choose one (Simple Weapons, Ground Vehicles)"
    ],
    feature: { name: "Ghost in the Logs", text: "You know the default passwords and common lazy backdoors left by tired system administrators. When accessing public or low-security terminals, you can often find hidden directories, developer notes, or bypass basic digital locks without needing to roll. The local digital underground treats you as a known and respected name." },
    contacts: "Choose two tech contacts, such as an old collective member, a code archivist, or a lightly crooked sysadmin.",
    hooks: [
      "The handle you retired, and who keeps using it to frame you."
    ],
    personalItem: "A battered deck, drive, or interface rig loaded with obsolete code that you can't bear to wipe."
  },
  {
    key: "courier",
    name: "Courier",
    blurb: "You live between checkpoints, schedules, and blind spots. You learned which cameras are real, which guards are bored, and which routes only work once. The city taught you that borders are suggestions enforced by habit, and habit can be broken.",
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
      "The package you refused to deliver, and who hasn't forgiven you."
    ],
    personalItem: "A stamped token, a set of keys to a vehicle you no longer own, or a heavily annotated physical map."
  },
  {
    key: "dealer",
    name: "Dealer",
    blurb: "You learned the economy that doesn't show up in reports. Product changes hands in parking garages, clinics, and half-lit rooms where everyone smiles too much. The trade taught you that trust is temporary, and survival is about reading people faster than they read you.",
    skills: {
      granted: ["Medtech"],
      choose: { count: 1, options: ["Persuasion", "Systems"] }
    },
    proficiencies: [
      "Tools: Choose one (Medical Tools, Bureaucracy Tools)",
      "Weapon/Vehicle: Choose one (Sidearms, Simple Weapons)"
    ],
    feature: { name: "Street Pharmacist", text: "You can instantly identify the chemical makeup, purity, and street value of almost any illicit substance or common pharmaceutical by sight, smell, or taste without needing to make a check. Local black-market chemists and street-level users will generally grant you a neutral audience." },
    contacts: "Choose two trade contacts, such as a cautious supplier, a clinic tech who buys off the books, or a rival dealer you sometimes partner with.",
    hooks: [
      "The supplier who kept you alive, and the leverage they still hold."
    ],
    personalItem: "A lucky chip, coin, or a hollowed-out credstick from a deal that should have gone bad."
  },
  {
    key: "ganger",
    name: "Ganger",
    blurb: "You grew up with lines drawn in paint, blood, and memory. Your crew was safety and pressure all at once, a family that demanded loyalty and paid in protection or pain. Even if you left the life behind, the street still recognizes you.",
    skills: {
      granted: ["Intuition"],
      choose: { count: 1, options: ["Athletics", "Stealth"] }
    },
    proficiencies: [
      "Tools: Choose one (Infiltration Tools, Security Tools)",
      "Weapon/Vehicle: Choose one (Sidearms, Simple Weapons)"
    ],
    feature: { name: "Colors and Codes", text: "You understand the unwritten rules of the street. You can automatically identify gang territories, active turf wars, and the meaning behind specific graffiti tags or tattoos. Lower-ranking gang members and unaffiliated street kids will typically treat you with cautious respect rather than immediate hostility." },
    contacts: "Choose two gang-related contacts, such as a lieutenant, a neutral go-between, or a community elder.",
    hooks: [
      "The rival who knows your real name, and the friend you left behind on that block."
    ],
    personalItem: "A tagged jacket, a patched bandana, or a photograph of the crew from before things fell apart."
  },
  {
    key: "gearhead",
    name: "Gearhead",
    blurb: "You're the reason broken things keep moving. Elevators, drones, generators, cyberware, vehicles, if it hums or sparks, you've probably cursed at it. You trust systems you can open more than promises you can't.",
    skills: {
      granted: ["Engineering"],
      choose: { count: 1, options: ["Athletics", "Systems"] }
    },
    proficiencies: [
      "Tools: Choose one (Engineering Tools, Systems Tools)",
      "Weapon/Vehicle: Choose one (Industrial / Mechs, Ground Vehicles)"
    ],
    feature: { name: "Junkyard Dog", text: "You know exactly where to find cheap, discarded, or overlooked hardware. You can usually scrounge up basic replacement parts, scrap metal, or functional low-tier tools from alleyways, abandoned vehicles, or local chop shops without spending any money, provided you have a few hours to search." },
    contacts: "Choose two hardware contacts, such as a scrapyard owner, a parts runner, or an old foreman.",
    hooks: [
      "The machine you rebuilt from scrap, and the person who claims you stole it."
    ],
    personalItem: "A grease-stained notebook or a perfectly weighted wrench that you refuse to use for actual labor."
  },
  {
    key: "glow-idol",
    name: "Glow Idol",
    blurb: "You worked spaces where attention is currency and safety is something you negotiate in real time. People talked around you, underestimated you, or forgot you were listening. You survived on intuition and presentation, knowing exactly when to lean in and when to disappear.",
    skills: {
      granted: ["Persuasion"],
      choose: { count: 1, options: ["Perception", "Deception"] }
    },
    proficiencies: [
      "Tools: Choose one (Glamour Tools, Infiltration Tools)",
      "Weapon/Vehicle: Choose one (Sidearms, Ground Vehicles)"
    ],
    feature: { name: "Velvet Rope", text: "You are a known face in the city's nightlife. You and your crew can bypass lines, cover charges, and low-level scrutiny at most standard clubs, bars, and lounges. Bouncers, bartenders, and venue staff will usually share minor local gossip with you if you ask nicely." },
    contacts: "Choose two contacts from your prior venues, such as a corporate client, a mid-tier fixer, or a club manager who trusts your instincts.",
    hooks: [
      "The secret you overheard that could ruin someone powerful, and why you kept it."
    ],
    personalItem: "A coded journal, an engraved lighter, or an empty perfume bottle from a very expensive client."
  },
  {
    key: "minimum-wage-mage",
    name: "Minimum Wage Mage",
    blurb: "You survived something that should have killed you and came back Flow-touched, with resonance humming under your skin. But progress never stops, so you went right back to your shift, your queues, your scripts, and the polite misery of a job that pays just enough to keep you showing up.",
    skills: {
      granted: ["Esoterica"],
      choose: { count: 1, options: ["Awareness", "Sleight"] }
    },
    proficiencies: [
      "Tools: Choose one (Ritual Implements, Bureaucracy Tools)",
      "Weapon/Vehicle: Choose one (Simple Weapons, Ground Vehicles)"
    ],
    feature: { name: "Shift Worker's Solidarity", text: "You blend perfectly into the background of the working class. Service workers, janitors, and retail clerks will often ignore you if you are somewhere you shouldn't be, assuming you are just another tired employee on a bad shift. You can also easily listen in on unfiltered workplace gossip without raising suspicion." },
    contacts: "Choose two people from your working life, such as a coworker, a shift manager, or a regular who knows too much.",
    hooks: [
      "The incident that left you Flow-touched, and the coworker who saw too much."
    ],
    personalItem: "A cheap, mass-produced uniform nametag or a breakroom coffee mug that somehow survived your awakening."
  },
  {
    key: "street-doc",
    name: "Street Doc",
    blurb: "You learned medicine where mistakes are immediate and forgiveness is rare. Back rooms, street clinics, and makeshift wards taught you triage over theory. You know how to work fast, improvise, and keep people alive with tools that were never meant for the job.",
    skills: {
      granted: ["Medtech"],
      choose: { count: 1, options: ["Perception", "Intuition"] }
    },
    proficiencies: [
      "Tools: Choose one (Medical Tools, Investigation Tools)",
      "Weapon/Vehicle: Choose one (Simple Weapons, Sidearms)"
    ],
    feature: { name: "The Hippocratic Underground", text: "The street respects the people who stitch it back together. You are generally considered neutral territory by local gangs and syndicates. Unless you are actively causing harm, most criminals will let you pass unharmed, and you can easily access underground black-market clinics and Ripperdoc lounges to ask questions." },
    contacts: "Choose two medical ties, such as a street clinic operator, a morgue tech, or a Ripperdoc.",
    hooks: [
      "The clinic, crew, or ripper with your number, and the favor they'll demand."
    ],
    personalItem: "A stained manual, a sterile scalpel you never use, or an overlay full of hard-won surgical notes."
  }
];
