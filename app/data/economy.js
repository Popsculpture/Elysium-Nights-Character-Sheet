/* ===========================================================================
   ELYSIUM NIGHTS - Economy and Rewards (reference layer)
   Extracted from Part 3, "Economy and Rewards". Costs in Glimmer.
   This file carries the chapter's TABLES and standing rules, including both
   1d8 GM reward tables and the payout split math. What is NOT here is the
   state: billing lifestyle each week, tracking safehouse upgrades a crew owns,
   a Crew Kit ledger, a debt list. `notModelled` names those explicitly so the
   gap stays visible.
   =========================================================================== */
window.EN = window.EN || {};

EN.economy = {
  exchangeRate: "The fair market reference value is 1 Nexus Token = 10,000 Glimmer. That is the number that appears in contracts, ledgers, and official books. Actual cash-out is lower, because verification, compliance, service, laundering, and transfer fees all take a cut.",
  // The reference value above as a number, for the one thing it is safe to compute:
  // reading a LISTED value stated in Nexus as a listed value in Glimmer (a lease
  // Buyout priced in ◎, when something needs to know what the item is worth). It is
  // deliberately NOT a cash-out rate. Nothing converts a wallet with it: the two
  // purses stay separate everywhere money actually moves, because the paragraph
  // above says the real rate is lower and unstated.
  nexusToGlimmer: 10000,

  /* What a token actually returns when somebody turns it into spendable Glimmer, as
     opposed to what the ledger says it is worth. REFERENCE DATA ONLY: nothing computes
     with these and no wallet converts, deliberately. The bands are wide and the
     unlicensed one comes with strings, so a conversion is a scene the GM runs, not a
     number the sheet can hand out. They are here because the sheet was quoting the
     reference value and saying nothing about the haircut, which is the part that
     actually bites a Freelancer.

     Worth knowing while reading the catalog: the four unleased items priced in BOTH
     currencies imply about 2,400 to 3,200 Glimmer per token, except the Warframe Shell
     at 9,600. That is not the catalog disagreeing with the reference value. Three of
     them sit inside the unlicensed band below, which is what a Freelancer selling a
     token on the street actually clears, and the corporate frame sits at the licensed
     reference. Anything the app prices off a stated Nexus figure (a lease Buyout, a
     repair lane) uses nexusToGlimmer above, because that asks what the OBJECT is worth
     in a ledger, not what its owner could liquidate a token for. */
  nexusConversionNote: "Actual cash-out is lower than the reference value because verification, compliance, service, laundering, and transfer fees all take a cut. What a token returns depends entirely on who is changing it.",
  nexusConversion: [
    { channel: "Legal, licensed exchange",       low: 5000, high: 7500, note: "Documented, traceable, and slow enough to be noticed" },
    { channel: "Unlicensed or black market",     low: 2000, high: 4000, note: "Faster and quieter, and the rate is the smallest thing you give up" }
  ],
  nexusUnlicensedRisks: [
    "Contract traps or clawback clauses",
    "Delayed or staggered payouts",
    "Future claims, favors, or leverage owed to the broker"
  ],
  nexusAssumptions: "Freelancers should not assume full access to the reference value, instant anonymous cash-out, or guaranteed safety when moving or converting Nexus.",

  currencies: [
    { name: "Glimmer",     symbol: "\u{1D4A2}", use: "Everyday purchases, gear, services, upkeep" },
    { name: "Nexus Token", symbol: "◎",    use: "Major contracts, institutional exchange, off world and corporate deals" }
  ],

  /* ---- lifestyle -------------------------------------------------------- */
  lifestyleNote: "Lifestyle is what it takes to live between jobs: lodging, food, water, hygiene, transit, comms, the small steady tax of staying alive. It is usually paid per week; in campaigns with longer downtime the GM may charge per month instead.",
  lifestyleTiers: [
    { tier: "Bare Survival", weekly: 200,   monthly: 800,   living: "Shared floor space, cheap food, public wash access, unreliable safety" },
    { tier: "Scraper",       weekly: 500,   monthly: 2000,  living: "Capsule room or shared bunk, local transit, minimal privacy" },
    { tier: "Stable",        weekly: 1000,  monthly: 4000,  living: "Decent room, regular meals, clean facilities, steady access" },
    { tier: "Comfortable",   weekly: 2000,  monthly: 8000,  living: "Private apartment or suite share, better food, paid comms, reliable transit" },
    { tier: "High Profile",  weekly: 5000,  monthly: 20000, living: "Guarded address, premium services, discretion, visible status" },
    { tier: "Luxury",        weekly: 15000, monthly: 60000, living: "Elite living, layered security, image management, privileged access" }
  ],
  lifestyleRules: [
    "A Character who does not pay at least Bare Survival is assumed to be couch surfing, squatting, sleeping rough, or living on favors. That should create fiction, not just a missing line item.",
    "A Character living at Stable or better is assumed to have enough legitimacy and presentation to function comfortably in ordinary legal environments.",
    "A Character living at High Profile or better is no longer invisible. Their money becomes part of their reputation."
  ],

  /* ---- safehouses -------------------------------------------------------- */
  safehouseRent: [
    { type: "Bolt-Hole Locker",   weekly: 250,   monthly: 1000,  notes: "Hidden stash, no true living comfort" },
    { type: "Crash Flat",         weekly: 750,   monthly: 3000,  notes: "Minimal room, poor security, enough for a short rotation" },
    { type: "Crew Apartment",     weekly: 1500,  monthly: 6000,  notes: "Real home base, storage, privacy, and recovery space" },
    { type: "Workshop Den",       weekly: 2500,  monthly: 10000, notes: "Crew space plus benches, tools, med or drone work area" },
    { type: "Hardened Safehouse", weekly: 5000,  monthly: 20000, notes: "Reinforced entry, hidden storage, cleaner papers, safer location" },
    { type: "Blacksite Hideout",  weekly: 15000, monthly: 60000, notes: "Serious concealment, layered security, dedicated infrastructure" }
  ],
  safehouseUpgrades: [
    { name: "Secure Locks and Cameras", ongoingWeekly: 100, cost: 1500, ongoing: "100 / week", benefit: "Better warning against intrusion" },
    { name: "Hidden Storage", ongoingWeekly: 0,           cost: 1000, ongoing: "none",       benefit: "Better concealment for contraband or sensitive goods" },
    { name: "Medical Nook", ongoingWeekly: 200,             cost: 2500, ongoing: "200 / week", benefit: "Supports treatment and stocked recovery supplies" },
    { name: "Drone Bench", ongoingWeekly: 200,              cost: 3000, ongoing: "200 / week", benefit: "Supports drone repair and systems work" },
    { name: "Ritual Corner", ongoingWeekly: 150,            cost: 2000, ongoing: "150 / week", benefit: "Supports reagent storage and Flow work" },
    { name: "Signal Masking", ongoingWeekly: 400,           cost: 5000, ongoing: "400 / week", benefit: "Better resistance to casual passive tracing" }
  ],

  /* ---- papers ------------------------------------------------------------ */
  licenses: [
    { item: "Basic legal renewal",                cost: "200 to 500",    renewal: "monthly or quarterly" },
    { item: "Weapon permit or regulated use fee", cost: "500 to 1,500",  renewal: "quarterly" },
    { item: "Cyberware registration upkeep",      cost: "1,000 to 3,000", renewal: "quarterly" },
    { item: "Shell identity maintenance",         cost: "500 to 2,000",  renewal: "monthly" },
    { item: "Brokered paperwork cleaning",        cost: "1,000 to 5,000", renewal: "as needed" }
  ],

  /* ---- between-contract income ------------------------------------------- */
  dayJobs: [
    { job: "Busker or street performer",              pay: "200 to 400",   time: "3 to 5 nights", web: "Other performers, regulars, local fixers" },
    { job: "Bartender or runner at a club",           pay: "300 to 500",   time: "4 to 5 nights", web: "Owners, regulars, dealers, the occasional cop" },
    { job: "Courier or delivery runner",              pay: "300 to 500",   time: "4 to 6 days",   web: "Dispatcher, recipients, route rivals" },
    { job: "Day labor (construction, dock, salvage)", pay: "400 to 600",   time: "5 days",        web: "Crew bosses, foremen, fellow workers" },
    { job: "Tech repair (street kiosk, drone shop)",  pay: "500 to 800",   time: "4 to 5 days",   web: "Regulars, suppliers, the occasional fence" },
    { job: "Ritual work for hire (consults, cleansings)", pay: "500 to 1,000", time: "2 to 4 days", web: "Believers, the desperate, the curious" },
    { job: "Performer at a recurring gig",            pay: "600 to 1,200", time: "3 to 4 nights", web: "Venue owners, fans, scene rivals" },
    { job: "Low-level fence or black market specialist", pay: "800 to 1,500", time: "3 to 5 days", web: "Buyers, suppliers, dangerous company" }
  ],

  /* ---- rewards ------------------------------------------------------------ */
  rewardTypes: [
    { type: "Liquid Glimmer",   meaning: "Spendable immediately with minimal friction" },
    { type: "Restricted Value", meaning: "Valuable, but tied to conversion, audit, or licensing" },
    { type: "Tagged Gear",      meaning: "Useful, but traceable, illegal, or politically sensitive" },
    { type: "Narrative Reward", meaning: "Access, favor, route, clearance, or patronage instead of cash" },
    { type: "Deferred Reward",  meaning: "Payment released later, in stages, or after conditions are met" }
  ],

  /* ---- Hypercare: the book's only ongoing coverage contract ------------
     Billed MONTHLY, unlike lifestyle and safehouse rent which bill weekly.
     Tiers 3 and 4 are priced in Nexus, so cost carries its own currency. */
  hypercareNote: "A prepaid emergency medical response service keyed to your #PRINT or a linked wearable tag. If you drop to 0 Wounds in a covered service area and the alert is transmitted, a Hypercare team is dispatched. Contracts are traceable, expensive, and often come with fine print.",
  hypercareTiers: [
    { tier: "Patchline",           rank: 1, cost: 300, currency: "glimmer", coverage: "Single district or defined zone",        response: "Dispatch only if conditions are safe enough" },
    { tier: "Rapid Extract",       rank: 2, cost: 600, currency: "glimmer", coverage: "Most major districts in one metro",      response: "Faster dispatch, will push into yellow conditions" },
    { tier: "Blackglass Priority", rank: 3, cost: 1.2, currency: "nexus",   coverage: "Metro wide, including fringe routes",    response: "Aggressive dispatch with security escort" },
    { tier: "Corporate Platinum",  rank: 4, cost: 2.5, currency: "nexus",   coverage: "Multi city network and travel corridors", response: "Best available dispatch, favors contracted clients" }
  ],

  /* ---- debt: shape only, deliberately not an accounting tool ------------
     The book is explicit: "Debt is a story engine, not an accounting tool.
     Track the holder and the clock; let the principal float a little." So the
     app tracks exactly those three fields and computes no interest. */
  debtKinds: ["Medical", "Gambling", "Faction", "Ritual", "Personal"],
  debtNote: "Each debt has a principal, a holder, and a clock. Holders rarely send polite reminders; debt in Elysium escalates through pressure, not paperwork.",

  /* ---- GM reward tables (both printed in full) ------------------------- */
  rewardTablesNote: "Use these when you need fast numbers.",
  glimmerRewards: [
    { roll: 1, reward: "Street payout", value: "100 to 300" },
    { roll: 2, reward: "Small job", value: "500 to 1,000" },
    { roll: 3, reward: "Mid tier contract", value: "1,500 to 3,000" },
    { roll: 4, reward: "Faction favor", value: "about 5,000" },
    { roll: 5, reward: "Captured goods or liquidated assets", value: "about 7,500" },
    { roll: 6, reward: "Major property retrieval or escort", value: "10,000 to 20,000" },
    { roll: 7, reward: "Corporate operation or high risk job", value: "30,000 to 50,000" },
    { roll: 8, reward: "Campaign defining world change", value: "about 100,000, once per campaign" }
  ],
  nexusRewardsNote: "Nexus should feel rare and meaningful.",
  nexusRewards: [
    { roll: 1, reward: "No direct Nexus, but gain access to an account, pillar, or vault" },
    { roll: 2, reward: "Access code or partial key that may lead to Nexus later" },
    { roll: 3, reward: "1 Nexus Token" },
    { roll: 4, reward: "2 Nexus Tokens" },
    { roll: 5, reward: "3 to 5 Nexus Tokens" },
    { roll: 6, reward: "10 Nexus Tokens for a major storyline success" },
    { roll: 7, reward: "15 to 20 Nexus Tokens for campaign-scale impact or faction shifts" },
    { roll: 8, reward: "100 Nexus Tokens as a one-time artifact-level event tied to a major arc or finale" }
  ],

  /* ---- splitting a payout ------------------------------------------------ */
  splitNote: "By default a contract payout splits evenly between every Freelancer who participated. A fixer's cut, when there is one, comes off the top before the split. A crew may also vote to dedicate 10 to 30 percent of every payout to a shared Crew Kit.",
  splitExample: "A four-person crew completing a 3,000 contract with a 15 percent fixer cut: the fixer takes 450, and the remaining 2,550 splits four ways at 637 each, with 2 left to argue over.",
  splitNonStandard: [
    "Tagged or watched goods may go to the crew member with the best laundering connections.",
    "Narrative rewards (a favor owed, an access code, a faction patron) usually attach to the Character who earned them in fiction.",
    "Single high-value items can be sold and split, kept by one member with the others taking IOU equivalents, or held in trust by the Crew Kit until needed."
  ],

  /* sections of the chapter this file does NOT carry yet, so the gap is
     visible rather than looking like the chapter is fully covered */
  notModelled: [
    "Crew Kit as a tracked shared fund (the split math itself is in the Payout Splitter)",
    "Debt and Obligation",
    "Captured Goods and Fences",
    "Flow-Touched and Haunted Goods",
    "Identity Theft and Account Compromise",
    "Services and Daily Spending, Premium Services, Bribes",
    "Regional Exchange Variation and Conversion Scene Complications",
  ]
};
