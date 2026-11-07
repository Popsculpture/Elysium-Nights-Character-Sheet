/* ===========================================================================
   ELYSIUM NIGHTS - Economy and Rewards (reference layer)
   Extracted from Part 3, "Economy and Rewards". Costs in Glimmer. Codex style (author-approved,
   6 November 2026): the book's own sentences, trimmed of flavour, advice and worked examples.
   This file carries the chapter's TABLES and standing rules, including both
   1d8 GM reward tables and the payout split math. Reward Types and both GM reward
   tables moved to the Game Master's Toolkit (2026-10-16 handoff, section 8): the
   Codex renders them in the Admin-only panel ref-rewards, never on the Freelancer
   desktop. What is NOT here is the
   state: billing lifestyle each week, tracking safehouse upgrades a crew owns,
   a Crew Kit ledger, a debt list. `notModelled` names those explicitly so the
   gap stays visible. The rules themselves are all here, for the Codex to print.
   =========================================================================== */
window.EN = window.EN || {};

EN.economy = {
  exchangeRate: "The fair market reference value is 1 Nexus Token = 10,000 Glimmer. That is the number that appears in contracts, ledgers, and official books. Actual cash-out is lower, because verification, compliance, service, laundering, and transfer fees all take a cut.",
  currencyNotes: [
    "Nexus Token is the formal name; Nexus alone is accepted shorthand. Carrying Nexus Tokens makes the group more valuable, more visible, and more likely to attract institutional attention.",
    "At the table, track total Glimmer. The smaller units (100 Flickers = 1 Gleam, 100 Gleams = 1 Glow) exist mainly for in-world flavor."
  ],
  // The reference value above as a number: the book's figure for its own prose. Nothing
  // in the app converts with it (A6-18, ruling 6). It is NOT a cash-out rate and no wallet
  // converts with it: the two purses stay separate everywhere money actually moves,
  // because the paragraph above says the real rate is lower and unstated.
  nexusToGlimmer: 10000,

  /* What a token actually returns when somebody turns it into spendable Glimmer, as
     opposed to what the ledger says it is worth. REFERENCE DATA ONLY: nothing computes
     with these and no wallet converts, deliberately. The bands are wide and the
     unlicensed one comes with strings, so a conversion is a scene the GM runs, not a
     number the sheet can hand out. They are here because the sheet was quoting the
     reference value and saying nothing about the haircut, which is the part that
     actually bites a Freelancer.

     Worth knowing while reading the catalog: the four unleased items priced in BOTH
     currencies imply about 2,400 to 3,200 Glimmer per token. That is not the catalog
     disagreeing with the reference value. All four sit inside the unlicensed band
     below, which is what a Freelancer selling a token on the street actually clears.
     (The Warframe Shell was the odd one out at 9,600 until the author's ruling of
     17 October 2026 made its price 2,400 or 1 token: a black-market street price.)
     Nothing in the app converts with nexusToGlimmer: it is the book's reference value for
     its prose. Every ◎ figure that repair pricing reads (a leased row's ◎ Buyout, or the
     price of a row sold only for Nexus) goes through crafting.js listPrice at
     nexusRepairRate, 3,000 Glimmer per token (the author's ruling 6 of 19 October 2026,
     A6-18): the Toolkit calls the Nexus price a street price that usually returns 2,000
     to 4,000 for one token. A Nexus Buyout is still billed in Nexus when bought
     (inventory.js buyoutCost); nothing converts it. */
  nexusConversion: [
    { channel: "Legal, licensed exchange",       low: 5000, high: 7500 },
    { channel: "Unlicensed or black market",     low: 2000, high: 4000 }
  ],
  nexusUnlicensedRisks: [
    "Contract traps or clawback clauses",
    "Delayed or staggered payouts",
    "Future claims, favors, or leverage owed to the broker"
  ],
  nexusAssumptions: "Freelancers should not assume full access to the reference value, instant anonymous cash-out, or guaranteed safety when moving or converting Nexus.",

  /* Access Rules for Nexus Conversion (19 October 2026 audit, social W20 and
     econ-unlisted-rules): the three conditions, the rule of thumb and the pointer. The
     Codex prints them under Converting Nexus to Glimmer. Reference only, like the bands above:
     nothing in the app checks a region, a clock or a clearance. */
  nexusAccess: {
    intro: "Freelancers may only convert Nexus if all three are true:",
    conditions: [
      "they are in a region that supports secure exchange",
      "they have enough in-world time to complete processing",
      "they meet identification, sponsorship, or clearance requirements"
    ],
    ruleOfThumb: "Rule of thumb: If the scene is loud, illegal, rushed, or under fire, conversion should be difficult, dangerous, or temporarily impossible.",
    rates: "Exchange rates shift from district to district. For guidance on rates and conversion risks, see the Game Master's Toolkit."
  },

  currencies: [
    { name: "Glimmer",     symbol: "\u{1D4A2}", use: "Everyday purchases, gear, services, upkeep" },
    { name: "Nexus Token", symbol: "◎",    use: "Major contracts, institutional exchange, off-world and corporate deals" }
  ],

  /* ---- lifestyle -------------------------------------------------------- */
  /* `open: true` on a lifestyle tier, a safehouse type or a Hypercare tier marks a price the
     Handbook prints as a minimum with a trailing "+" (Luxury 15,000+ a week and 60,000+ a
     month, Blacksite Hideout the same, Corporate Platinum 2.5+; 19 October 2026 audit,
     econ-open-prices). The numbers stay the minimum and billing charges them; only the
     displays add the "+". */
  lifestyleNote: "Lifestyle covers lodging, food, water, hygiene, transit, and comms between jobs. It is usually paid per week; in campaigns with longer Downtime the GM may charge per month instead.",
  lifestyleTiers: [
    { tier: "Bare Survival", weekly: 200,   monthly: 800,   living: "Shared floor space, cheap food, public wash access, unreliable safety" },
    { tier: "Scraper",       weekly: 500,   monthly: 2000,  living: "Capsule room or shared bunk, local transit, minimal privacy" },
    { tier: "Stable",        weekly: 1000,  monthly: 4000,  living: "Decent room, regular meals, clean facilities, steady access" },
    { tier: "Comfortable",   weekly: 2000,  monthly: 8000,  living: "Private apartment or suite share, better food, paid comms, reliable transit" },
    { tier: "High Profile",  weekly: 5000,  monthly: 20000, living: "Guarded address, premium services, discretion, visible status" },
    { tier: "Luxury",        weekly: 15000, monthly: 60000, open: true, living: "Elite living, layered security, image management, privileged access" }
  ],
  lifestyleRules: [
    "A Character who doesn't pay at least Bare Survival is assumed to be couch surfing, squatting, sleeping rough, or living on favors. That should leave them exposed.",
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
    { type: "Blacksite Hideout",  weekly: 15000, monthly: 60000, open: true, notes: "Serious concealment, layered security, dedicated infrastructure" }
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
  dayJobsIntro: "A Freelancer can pick up a day job at Character creation, or any time they are settled enough to look for steady work. Each one has a weekly pay rate, a time commitment (how many days per week it eats), and a social web (who notices when you don't show up).",
  dayJobs: [
    { job: "Busker or street performer",              pay: "200 to 400",   time: "3 to 5 nights", web: "Other performers, regulars, local fixers" },
    { job: "Bartender or runner at a club",           pay: "300 to 500",   time: "4 to 5 nights", web: "Owners, regulars, dealers, the occasional cop" },
    { job: "Courier or delivery runner",              pay: "300 to 500",   time: "4 to 6 days",   web: "Dispatcher, recipients, route rivals" },
    { job: "Day labor (construction, dock, salvage)", pay: "400 to 600",   time: "5 days",        web: "Crew bosses, foremen, fellow workers" },
    { job: "Tech repair (street kiosk, drone shop)",  pay: "500 to 800",   time: "4 to 5 days",   web: "Regulars, suppliers, the occasional fence" },
    { job: "Ritual work for hire (small consults, cleansings)", pay: "500 to 1,000", time: "2 to 4 days", web: "Believers, the desperate, the curious" },
    { job: "Performer at a recurring gig (band, drag, residency)",            pay: "600 to 1,200", time: "3 to 4 nights", web: "Venue owners, fans, scene rivals" },
    { job: "Low-level fence, mod work, or black-market specialist", pay: "800 to 1,500", time: "3 to 5 days", web: "Buyers, suppliers, dangerous people" }
  ],
  /* How Day Jobs Affect Play (19 October 2026 audit, social W20 and
     econ-unlisted-rules). One paragraph per entry; the Codex prints them under the day job table. */
  dayJobsEffect: [
    "A day job ties you to other people, and people at the job notice things.",
    "The Character earns the listed weekly pay automatically, as long as they show up.",
    "On weeks when crew work prevents them from working, the GM may reduce pay or impose social complications.",
    "The GM may impose Snag on mission planning rolls when a Character is splitting attention between crew work and a day job.",
    "A Freelancer can quit at any time. Quitting cleanly usually costs a goodbye scene, a final favor, or a small social wound. Quitting badly leaves a thread that someone can pull later."
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
  hypercareNote: "A prepaid emergency medical response service keyed to your #PRINT or a linked wearable tag, billed monthly and paid in advance. If you drop to 0 Wounds in a covered service area and the alert is transmitted, a Hypercare team is dispatched.",
  /* The Handbook's Limitation line for the contract (19 October 2026 audit, hypercare-services),
     word for word. The note above used to end on its first sentence; the Codex prints this as
     the "Limitation:" line under it. Each tier's `services` is the book's Included Services
     column. A tier with `open: true` (Corporate Platinum, 2.5+) is a minimum price: the number
     is what billing charges, and the Codex prints a trailing "+". */
  hypercareLimitation: "Contracts are traceable, expensive, and often come with fine print. Treat this as a story device as much as a strict rule. The GM decides whether contracts are available in their campaign.",
  hypercareTiers: [
    { tier: "Patchline",           rank: 1, cost: 300, currency: "glimmer", coverage: "Single district or defined zone",        response: "Dispatch only if conditions are safe enough", services: "Stabilize, stop bleeding, basic evac to nearest public clinic" },
    { tier: "Rapid Extract",       rank: 2, cost: 600, currency: "glimmer", coverage: "Most major districts in one metro",      response: "Faster dispatch, will push into yellow conditions", services: "Stabilize plus trauma care, priority transport to partnered facility" },
    { tier: "Blackglass Priority", rank: 3, cost: 1.2, currency: "nexus",   coverage: "Metro-wide, including fringe routes",    response: "Aggressive dispatch with security escort", services: "Field surgery kit, blood substitutes, discreet routing, secure intake" },
    { tier: "Corporate Platinum",  rank: 4, cost: 2.5, open: true, currency: "nexus", coverage: "Multi-city network and travel corridors", response: "Best available dispatch, favors contracted clients", services: "Full trauma package, on-scene doc, hush protocols, private ward admission" }
  ],

  /* ---- debt: shape only, deliberately not an accounting tool ------------
     The book is explicit: "Debt is a story engine, not an accounting tool.
     Track the holder and the clock; let the principal float a little." So the
     app tracks exactly those three fields and computes no interest. */
  debtKinds: ["Medical", "Gambling", "Faction", "Ritual", "Personal"],
  debtNote: "Each debt has a principal (what is owed, in Glimmer, Nexus, favors, or something stranger), a holder (who is owed), and a clock (when payment is expected, or what triggers collection).",
  debtRules: {
    start: "A Character may begin play with debt (negotiated with the GM at Character creation) or accumulate it through play. Debt escalates through pressure, not paperwork. As a deadline approaches or passes, the GM should:",
    pressure: [
      "Use the holder as a recurring NPC who shows up at inconvenient times",
      "Add Snag to social rolls in the holder's territory",
      "Offer the Character a \"favor\" that wipes some debt at the cost of doing something they wouldn't normally do",
      "Eventually move to direct collection (cyberware repossession, a forced job, a public humiliation, an organ)"
    ],
    paying: "Debt can be paid in cash, at the principal amount plus accumulated interest or pressure fees; in favors, at the holder's discretion; in ritual or symbolic acts, for ritual debt; or in blood, for the worst kinds."
  },

  /* ---- GM reward tables (both printed in full) ------------------------- */
  glimmerRewards: [
    { roll: 1, reward: "Street payout", value: "100 to 300" },
    { roll: 2, reward: "Small job", value: "500 to 1,000" },
    { roll: 3, reward: "Mid-tier contract", value: "1,500 to 3,000" },
    { roll: 4, reward: "Faction favor", value: "about 5,000" },
    { roll: 5, reward: "Captured goods or liquidated assets", value: "about 7,500" },
    { roll: 6, reward: "Major property retrieval or escort", value: "10,000 to 20,000" },
    { roll: 7, reward: "Corporate operation or high-risk job", value: "30,000 to 50,000" },
    { roll: 8, reward: "Campaign-defining world change", value: "about 100,000, once per campaign" }
  ],
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
  splitNote: "By default a contract payout splits evenly between every Freelancer who participated. A fixer's cut, when there is one, comes off the top before the split. Each share rounds down, and the crew settles what's left over. Typical fixer cuts run 10 to 20 percent; higher cuts mean better intelligence and more protection. A crew may also vote to dedicate 10 to 30 percent of every payout to a shared Crew Kit, held by one Character or split across multiple accounts. Anything inside the Crew Kit is also a target.",
  splitNonStandard: [
    "Tagged or watched goods may go to the crew member with the best laundering connections.",
    "Narrative rewards (a favor owed, an access code, a faction patron) usually attach to the Character who earned them in fiction.",
    "Single high-value items can be sold and split, kept by one member with the others taking IOU equivalents, or held in trust by the Crew Kit until needed."
  ],

  /* ---- Captured Goods and Fences: the rates --------------------------------- */
  fenceRatesNote: "To turn loot into Glimmer, a crew has to find a fence who deals in that kind of merchandise, negotiate a price, and complete the transfer without attracting attention. Fences pay a fraction of an item's listed value, depending on the type of goods and the heat on them.",
  fenceRates: [
    { goods: "Common contraband (street weapons, drugs, knock-off mods)", payout: "30 to 50 percent of market", notes: "Most fences will take this" },
    { goods: "Stolen consumer tech",                     payout: "20 to 40 percent of market", notes: "Tracked by serial; a smart fence wipes it first" },
    { goods: "Corporate equipment or branded gear",      payout: "25 to 50 percent of market", notes: "Branding matters; some fences specialize" },
    { goods: "Restricted or military-grade equipment",   payout: "30 to 60 percent of market", notes: "Only specialists handle this" },
    { goods: "Identifying documents, ID chips, #PRINTs", payout: "40 to 60 percent of market", notes: "Pricing depends on forge quality" },
    { goods: "Relics, antiques, or Flow-touched goods",  payout: "Variable",                   notes: "Specialty market" }
  ],
  fenceShifts: [
    "Heat: If the goods are being actively searched for, expect another 50 percent off the top.",
    "Reputation: A crew that has fenced cleanly before negotiates better. A burned crew may not get a meeting at all.",
    "Quantity: Wholesale moves bring better unit rates but draw more attention.",
    "Timing: Anything sold in a hurry sells for less."
  ],

  /* ---- Flow-Touched and Haunted Goods --------------------------------------- */
  flowTouched: "A Flow-touched object has been used in a successful Invocation, fashioned by a Shaper, recovered from the site of a Resonant Storm, or left too long near a Node. Flow-touched goods cost 2x to 10x the listed price of an equivalent normal item, and are almost always Restricted or Contraband in corporate districts. The multiplier depends on:",
  flowTouchedFactors: [
    "Stability: A relic that performs reliably costs more. One that performs unpredictably costs less, but sells faster.",
    "Resonance type: Some Flow signatures are worth more to specific buyers.",
    "Provenance: Documented relics fetch a premium. Anonymous relics fetch a discount.",
    "Rumor: A relic with the right story sells. A relic with the wrong story is unsellable."
  ],
  hauntedProperty: "Real estate that the #GRID, the Flow, or both haven't finished with typically rents or sells for 30 to 70 percent below market. The discount reflects unpredictable #GRID behavior, occasional Flow phenomena, reputation damage, and active hauntings. A crew may take a haunted safehouse as a financial advantage and accept the complications.",

  /* ---- Identity Theft and Account Compromise --------------------------------- */
  identityTheft: {
    taken: "A successful breach of a Freelancer's accounts can take digital Glimmer, stored Nexus (held in audit lock until ownership is resolved), identity (a #PRINT clone with your name on it), faction standing, locations (safehouse address, vehicle registration, frequent destinations), and contacts (your fixer's channel, your fence's preferred drop). Recovery is slow and expensive:",
    recovery: [
      "Lock down accounts. Free if you act fast, slow and costly if you don't. Affected accounts go into audit hold for 1d6 days.",
      "Replace #PRINT identity. 𝒢2,000 to 𝒢5,000 to re-issue it on a fresh chip, plus fees and Downtime, depending on legitimacy tier.",
      "Restore reputation. If your faction standing was poisoned by fake transactions, recovery may require negotiation, public correction, or a small contract to prove you are still you.",
      "Track the attacker. Optional, dangerous, and rarely fast."
    ],
    protection: "A few services sell protection against this. All are expensive, all have fine print, and none are foolproof."
  },

  /* ---- Services and Bribes --------------------------------------------------- */
  serviceCosts: [
    { service: "Street clinic treatment",            cost: "200 to 800" },
    { service: "Private medical consult",            cost: "750 to 2,000" },
    { service: "Basic repair job",                   cost: "250 to 1,000" },
    { service: "Specialist diagnostics",             cost: "1,000 to 3,000" },
    { service: "Encrypted courier run",              cost: "500 to 2,500" },
    { service: "Local fixer fee",                    cost: "250 to 1,500" },
    { service: "Smuggler passage",                   cost: "1,000 to 5,000" },
    { service: "Quiet data scrub",                   cost: "750 to 3,000" },
    { service: "Public legal help",                  cost: "500 to 1,500" },
    { service: "Private counsel or hush specialist", cost: "2,500+" }
  ],
  bribeTiers: [
    { tier: "Petty Grease",        cost: "50 to 250",        buys: "Looking the other way, faster access, a small convenience" },
    { tier: "Street Smoothover",   cost: "250 to 1,000",     buys: "A warning, dropped attention, a minor favor" },
    { tier: "Professional Risk",   cost: "1,000 to 5,000",   buys: "A forged timestamp, a delayed report, a brokered introduction" },
    { tier: "Serious Corruption",  cost: "5,000 to 20,000",  buys: "Lost evidence, zone access, erased footage, clearance abuse" },
    { tier: "Career-Ending Money", cost: "20,000+ or ◎1+",   buys: "Deep betrayal, sealed file tampering, institutional compromise" }
  ],
  bribeNote: "The money alone is never enough. The target must also believe they can survive the risk.",

  /* ---- Choosing a Fence (Captured Goods and Fences) ------------------------
     Part 3 (modifiedTime 2026-10-04T03:05:35.328Z), the section of that name, word for word.
     Each type is the book's bold lead (`name`) and the rest of its line (`text`). APP FIELDS:
     `key`, the stored key a contact's fence tag uses (ch.face.contacts[].fence, a stored key:
     renaming one needs a migration row), and `label`, the short name the tag shows. The fence
     rates and the rest of Captured Goods are still in notModelled below. The Codex renders this
     in the Social chapter's Contacts & Fences panel (so-contacts), beside the Background grant. */
  fences: {
    intro: "Different fences specialize. The crew that has cultivated the right contact moves faster and cleaner. A short directory worth seeding into the setting:",
    types: [
      { key: "relic",  label: "Relic broker",    name: "The pre-Cascade relic broker", text: "who only takes antiques and refuses anything still warm." },
      { key: "cyber",  label: "Cyberware fence", name: "The cyberware fence",          text: "who refuses to deal with anything pulled out of a person who was still alive." },
      { key: "data",   label: "Data broker",     name: "The data broker",              text: "who launders through a noodle shop and pays in Nexus when they like the source." },
      { key: "street", label: "Street fence",    name: "The street fence",             text: "who buys anything, pays street rates, and asks no questions." }
    ],
    rule: "A Freelancer who has the right Fence Contact (acquired through Background or earned in play) skips the search phase and goes straight to negotiation. Without one, finding a buyer is its own scene."
  },

  /* what the sheet itself does not track or price, though the rules are printed above */
  notModelled: [
    "The Crew Kit as a tracked fund (the Payout Splitter computes its share)",
    "Debt escalation (Bills tracks each debt's kind, holder, principal and clock, with no interest calculated)",
    "Fence sales, and Flow-touched and haunted goods",
    "Identity theft and account compromise",
    "Services and bribes"
  ],
  /* 2026-10-16 handoff, section 8: these two sections left the Handbook for the Game
     Master's Toolkit, so the Freelancer's "they live in the book" list no longer names
     them. The Codex shows this list on the Admin desktop only (js/codex.js ref-economy). */
  notModelledToolkit: [
    "Regional Exchange Variation and Conversion Scene Complications",
    // the Toolkit's Personal Hooks section (19 October 2026 rulings, 9: not modelled)
    "Personal Hooks"
  ]
};
