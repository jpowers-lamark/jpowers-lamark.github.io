export const STAGES = [
  {
    "id": "welcome",
    "number": "00",
    "kicker": "ARRIVAL",
    "title": "Enter the Lab",
    "duration": 180,
    "purpose": "Join the room, understand the rules, and see who is participating."
  },
  {
    "id": "fracture",
    "number": "01",
    "kicker": "ACT I",
    "title": "The Search Fracture",
    "duration": 480,
    "purpose": "Make fragmented search behavior visible through the team’s own responses."
  },
  {
    "id": "definition",
    "number": "02",
    "kicker": "ACT I",
    "title": "What Search Everywhere Means",
    "duration": 420,
    "purpose": "Reframe search as decision behavior rather than a single channel."
  },
  {
    "id": "ecosystem",
    "number": "03",
    "kicker": "ACT II",
    "title": "The Search Ecosystem",
    "duration": 540,
    "purpose": "Understand the role each search surface plays and the signals it reads."
  },
  {
    "id": "journey",
    "number": "04",
    "kicker": "ACT II",
    "title": "Journey Builder",
    "duration": 900,
    "purpose": "Build the complete path from trigger through action and advocacy."
  },
  {
    "id": "portals",
    "number": "05",
    "kicker": "ACT III",
    "title": "Client Portals",
    "duration": 420,
    "purpose": "See how the same framework changes across ecommerce and legal search."
  },
  {
    "id": "audit",
    "number": "06",
    "kicker": "ACT III",
    "title": "Audit Command Center",
    "duration": 1200,
    "purpose": "Collect, filter, score, and challenge evidence across search surfaces."
  },
  {
    "id": "whiteboard",
    "number": "07",
    "kicker": "ACT III",
    "title": "Evidence Whiteboard",
    "duration": 720,
    "purpose": "Place evidence, gaps, questions, and actions onto the shared journey."
  },
  {
    "id": "auction",
    "number": "08",
    "kicker": "ACT IV",
    "title": "Signal Auction",
    "duration": 600,
    "purpose": "Allocate limited resources and learn why platforms reward different signals."
  },
  {
    "id": "dualvision",
    "number": "09",
    "kicker": "ACT IV",
    "title": "Human + Machine View",
    "duration": 720,
    "purpose": "Connect what people experience to what search and recommendation systems can interpret."
  },
  {
    "id": "shock",
    "number": "10",
    "kicker": "ACT IV",
    "title": "Search Shock",
    "duration": 600,
    "purpose": "Respond to an unexpected change in the search ecosystem."
  },
  {
    "id": "strategy",
    "number": "11",
    "kicker": "ACT V",
    "title": "Strategy War Room",
    "duration": 900,
    "purpose": "Select, score, and defend the initiatives that should move first."
  },
  {
    "id": "challenge",
    "number": "12",
    "kicker": "ACT V",
    "title": "Client Challenge",
    "duration": 600,
    "purpose": "Teach the model back clearly under pressure."
  },
  {
    "id": "debrief",
    "number": "13",
    "kicker": "FINAL ACT",
    "title": "Lock In the Operating Model",
    "duration": 420,
    "purpose": "Capture commitments, confidence, and the next application."
  }
];

export const JOURNEY_STAGES = [
  {
    "id": "trigger",
    "label": "Trigger",
    "description": "A need, problem, desire, or event creates uncertainty.",
    "exampleBreezy": "A trip, tournament, creator clip, or new style creates product interest.",
    "exampleKp": "A claim denial, accident, storm, or insurer dispute creates urgent need."
  },
  {
    "id": "ask",
    "label": "Ask",
    "description": "The person frames the question in their own language.",
    "exampleBreezy": "What should I wear for a hot golf trip?",
    "exampleKp": "What should I do after an underpaid insurance claim?"
  },
  {
    "id": "scan",
    "label": "Scan",
    "description": "They generate possible answers, brands, products, or providers.",
    "exampleBreezy": "Google, Shopping, TikTok, Instagram, and creator content surface options.",
    "exampleKp": "Google, AI answers, Maps, directories, and referrals surface firms."
  },
  {
    "id": "compare",
    "label": "Compare",
    "description": "They evaluate differences, fit, price, expertise, location, or process.",
    "exampleBreezy": "Compare products, fabrics, fit, price, shipping, and alternatives.",
    "exampleKp": "Compare practices, offices, attorneys, fees, reviews, and claim experience."
  },
  {
    "id": "validate",
    "label": "Validate",
    "description": "They seek independent proof and reassurance.",
    "exampleBreezy": "Reddit, reviews, YouTube, customer photos, and creator credibility.",
    "exampleKp": "Reviews, case proof, attorney credentials, Reddit, local signals, and third-party mentions."
  },
  {
    "id": "act",
    "label": "Act",
    "description": "They complete the business action.",
    "exampleBreezy": "Purchase, add to cart, subscribe, or visit a product page.",
    "exampleKp": "Call, submit a form, request a consultation, or visit an office."
  },
  {
    "id": "share",
    "label": "Learn / Share",
    "description": "They return, review, recommend, or continue the relationship.",
    "exampleBreezy": "Repeat purchase, branded search, review, or social sharing.",
    "exampleKp": "Case updates, referrals, reviews, and ongoing informational search."
  }
];

export const PLATFORMS = [
  {
    "id": "google",
    "name": "Google Search",
    "short": "Google",
    "icon": "G",
    "role": "Explicit demand capture",
    "intent": "Questions, categories, comparisons, brands, services, and high-intent actions.",
    "signals": [
      "Topical relevance",
      "Authority",
      "Entity clarity",
      "Links and citations",
      "Freshness",
      "Page experience"
    ],
    "kpis": [
      "Impressions",
      "Clicks",
      "CTR",
      "Rankings",
      "Conversions"
    ],
    "color": "#2864dc"
  },
  {
    "id": "ai",
    "name": "AI Answers",
    "short": "AI",
    "icon": "AI",
    "role": "Synthesis and recommendation",
    "intent": "Complex questions, explanation, option generation, and direct answers.",
    "signals": [
      "Clear entities",
      "Crawlable facts",
      "Corroboration",
      "Citations",
      "Structured information",
      "Freshness"
    ],
    "kpis": [
      "Mention rate",
      "Citation rate",
      "Answer accuracy",
      "Assisted demand"
    ],
    "color": "#7657d8"
  },
  {
    "id": "maps",
    "name": "Maps + Local",
    "short": "Maps",
    "icon": "M",
    "role": "Proximity and immediate action",
    "intent": "Near-me, directions, hours, local trust, calls, and visits.",
    "signals": [
      "Relevance",
      "Distance",
      "Prominence",
      "Reviews",
      "Listing accuracy",
      "Local consistency"
    ],
    "kpis": [
      "Calls",
      "Directions",
      "Website actions",
      "Local leads"
    ],
    "color": "#159170"
  },
  {
    "id": "reddit",
    "name": "Reddit + Communities",
    "short": "Reddit",
    "icon": "R",
    "role": "Peer validation and objection mining",
    "intent": "Honest opinions, lived experience, alternatives, risk, and niche questions.",
    "signals": [
      "Authenticity",
      "Community fit",
      "Usefulness",
      "Recency",
      "Consensus",
      "Participation"
    ],
    "kpis": [
      "Mention themes",
      "Sentiment",
      "Referral sessions",
      "Content insights"
    ],
    "color": "#e05d2b"
  },
  {
    "id": "youtube",
    "name": "YouTube",
    "short": "YouTube",
    "icon": "▶",
    "role": "Demonstration and proof",
    "intent": "Reviews, walkthroughs, comparisons, how-to content, and expectations.",
    "signals": [
      "Topic alignment",
      "Engagement",
      "Watch behavior",
      "Quality",
      "Creator authority",
      "Freshness"
    ],
    "kpis": [
      "Search views",
      "Watch time",
      "CTR",
      "Assisted sessions"
    ],
    "color": "#d73b48"
  },
  {
    "id": "social",
    "name": "TikTok + Instagram Search",
    "short": "Social search",
    "icon": "S",
    "role": "Visual discovery and creator-led answers",
    "intent": "Styles, places, trends, products, recommendations, and quick solutions.",
    "signals": [
      "Content language",
      "Engagement",
      "Creator relevance",
      "Freshness",
      "Visual match",
      "Saves"
    ],
    "kpis": [
      "Search views",
      "Saves",
      "Profile visits",
      "Tagged sessions"
    ],
    "color": "#c84f92"
  },
  {
    "id": "reviews",
    "name": "Reviews + Directories",
    "short": "Reviews",
    "icon": "★",
    "role": "Trust compression",
    "intent": "Legitimacy, quality, responsiveness, experience, and social proof.",
    "signals": [
      "Rating",
      "Recency",
      "Volume",
      "Specificity",
      "Response quality",
      "Consistency"
    ],
    "kpis": [
      "Rating trend",
      "Review velocity",
      "Profile actions",
      "Conversion rate"
    ],
    "color": "#b27a19"
  },
  {
    "id": "shopping",
    "name": "Shopping + Marketplaces",
    "short": "Shopping",
    "icon": "$",
    "role": "Product comparison and transaction",
    "intent": "Price, availability, variants, shipping, ratings, and purchase.",
    "signals": [
      "Product data",
      "Price",
      "Availability",
      "Images",
      "Reviews",
      "Feed accuracy"
    ],
    "kpis": [
      "Product impressions",
      "Clicks",
      "Revenue",
      "Conversion"
    ],
    "color": "#0f7c8c"
  },
  {
    "id": "site",
    "name": "Owned Website",
    "short": "Website",
    "icon": "W",
    "role": "Decision resolution and action",
    "intent": "Official facts, deeper proof, navigation, conversion, and support.",
    "signals": [
      "Clarity",
      "Information architecture",
      "Structured data",
      "UX",
      "Proof",
      "Action path"
    ],
    "kpis": [
      "Engagement",
      "Leads",
      "Revenue",
      "Assisted conversion"
    ],
    "color": "#1d314f"
  }
];

export const SIGNALS = [
  {
    "id": "relevance",
    "name": "Topical relevance",
    "description": "The content and entity match the expressed need."
  },
  {
    "id": "entity",
    "name": "Entity clarity",
    "description": "The brand, people, places, products, and services are consistently identifiable."
  },
  {
    "id": "authority",
    "name": "Authority + citations",
    "description": "Other credible sources reference, link to, or corroborate the brand."
  },
  {
    "id": "reviews",
    "name": "Reviews + reputation",
    "description": "Recent, specific, credible customer experience reduces perceived risk."
  },
  {
    "id": "community",
    "name": "Community consensus",
    "description": "Peer discussions and lived experience reinforce or challenge brand claims."
  },
  {
    "id": "creator",
    "name": "Creator credibility",
    "description": "Trusted people demonstrate or contextualize the product or service."
  },
  {
    "id": "local",
    "name": "Local accuracy",
    "description": "Location, hours, phone, categories, service areas, and proximity are reliable."
  },
  {
    "id": "structured",
    "name": "Structured information",
    "description": "Machines can parse the facts and relationships consistently."
  },
  {
    "id": "product",
    "name": "Product + service detail",
    "description": "Price, availability, fit, process, scope, and differences are explicit."
  },
  {
    "id": "freshness",
    "name": "Freshness",
    "description": "Information, availability, reviews, and guidance are current."
  },
  {
    "id": "experience",
    "name": "First-hand experience",
    "description": "Evidence shows that real people or experts have done the thing being described."
  },
  {
    "id": "conversion",
    "name": "Action clarity",
    "description": "The next step is obvious, credible, and low-friction."
  }
];

export const CLIENTS = {
  "breezy": {
    "key": "breezy",
    "name": "Breezy Golf",
    "label": "ECOMMERCE + LIFESTYLE",
    "accent": "#14775c",
    "summary": "A visual-commerce search system where creator discovery, product comparison, fit confidence, community proof, and product-page clarity combine to drive purchase.",
    "audiences": [
      "Style-led golfers",
      "Bob Does Sports fans",
      "Performance apparel shoppers",
      "Gift shoppers",
      "Big-and-tall golfers"
    ],
    "primaryPlatforms": [
      "social",
      "google",
      "shopping",
      "youtube",
      "reddit",
      "reviews",
      "site"
    ],
    "coreQuestions": [
      "Is Breezy Golf worth the price?",
      "How does Breezy fit?",
      "Which polo works in hot weather?",
      "How does Breezy compare with Rhoback or Peter Millar?",
      "What are real customers saying?"
    ],
    "journey": [
      "social",
      "google",
      "shopping",
      "reddit",
      "youtube",
      "site"
    ],
    "outcomes": [
      "Non-brand revenue",
      "Branded conversion",
      "Product confidence",
      "Repeat purchase",
      "Lower return risk"
    ]
  },
  "kp": {
    "key": "kp",
    "name": "Kanner & Pintaluga",
    "label": "LEGAL + LOCAL TRUST",
    "accent": "#9a6818",
    "summary": "A high-stakes search system where urgency, legal clarity, local relevance, attorney credibility, reviews, and consistent firm facts determine whether a person makes contact.",
    "audiences": [
      "Property owners with disputed claims",
      "Accident victims",
      "Urgent local legal searchers",
      "Referral-driven prospects",
      "Reassurance-seeking families"
    ],
    "primaryPlatforms": [
      "google",
      "ai",
      "maps",
      "reviews",
      "reddit",
      "youtube",
      "site"
    ],
    "coreQuestions": [
      "Do I need an attorney?",
      "Can this firm handle my type of claim?",
      "Is this office legitimate and nearby?",
      "What will the process and cost look like?",
      "Can I trust this firm with a high-stakes problem?"
    ],
    "journey": [
      "ai",
      "google",
      "maps",
      "reviews",
      "site"
    ],
    "outcomes": [
      "Qualified leads",
      "Call conversion",
      "Local visibility",
      "Trust",
      "Fact accuracy"
    ]
  }
};

export const SHOCKS = [
  {
    "id": "ai-omission",
    "title": "AI Citation Loss",
    "description": "An AI answer recommends three competitors and does not mention the client.",
    "questions": [
      "Which stage is affected?",
      "What evidence or entity signals are missing?",
      "What should Lamark recommend first?"
    ]
  },
  {
    "id": "reddit-rank",
    "title": "Reddit Reputation Event",
    "description": "A negative community thread begins ranking for a branded review query.",
    "questions": [
      "Is the issue visibility, trust, or both?",
      "What should be corrected on owned properties?",
      "Where should the brand participate, if anywhere?"
    ]
  },
  {
    "id": "local-conflict",
    "title": "Local Profile Conflict",
    "description": "Hours, phone, category, or office status differs between the site, Maps, and directories.",
    "questions": [
      "Which user actions are at risk?",
      "Which source becomes canonical?",
      "Who owns the fix and governance?"
    ]
  },
  {
    "id": "creator-spike",
    "title": "Creator-Led Demand Spike",
    "description": "A creator causes a product or travel category to trend, but the client has no supporting search asset.",
    "questions": [
      "How do we capture the demand?",
      "Which assets are required?",
      "How do we measure assisted impact?"
    ]
  },
  {
    "id": "review-gap",
    "title": "Review Credibility Gap",
    "description": "Competitors have materially stronger recent review activity and more specific customer proof.",
    "questions": [
      "Which journey stage leaks?",
      "What is SEO’s consulting role?",
      "What operational team must execute?"
    ]
  },
  {
    "id": "serp-displacement",
    "title": "Search Result Displacement",
    "description": "AI answers, video, discussions, shopping, or local results push traditional organic listings lower.",
    "questions": [
      "Which surfaces now own attention?",
      "How should the audit change?",
      "Which KPI should stop being viewed in isolation?"
    ]
  },
  {
    "id": "message-conflict",
    "title": "Cross-Platform Message Conflict",
    "description": "The website, social profiles, reviews, and third-party descriptions communicate different value propositions.",
    "questions": [
      "What entity or trust risk does this create?",
      "What is the source-of-truth statement?",
      "How is consistency governed?"
    ]
  },
  {
    "id": "zero-click",
    "title": "Zero-Click Resolution",
    "description": "A user receives enough information from Google or an AI assistant to decide without visiting the website.",
    "questions": [
      "What business outcome can still be influenced?",
      "Which offsite signal matters?",
      "How should measurement adapt?"
    ]
  }
];

export const OBJECTIONS = [
  "Why are we talking about Reddit when you do not manage our social media?",
  "Isn’t this just social media marketing with a different name?",
  "Why should we care about TikTok if purchases or leads happen on our website?",
  "How can we measure Search Everywhere without pretending every platform is equally attributable?",
  "Why not put all our resources into Google?",
  "How does offsite activity affect organic performance?",
  "What is SEO actually responsible for in this model?",
  "How do we know which platforms matter for our audience?",
  "What happens when a platform does not provide keyword volume?",
  "How would this change our current SEO roadmap?",
  "Are AI assistants a separate strategy?",
  "What would Lamark actually deliver to the client?"
];

export const HUMAN_SIGNALS = [
  {
    "id": "relevant",
    "name": "This is relevant to me",
    "machine": [
      "relevance",
      "entity"
    ],
    "outcome": "Qualified visibility"
  },
  {
    "id": "trusted",
    "name": "Other people trust this",
    "machine": [
      "reviews",
      "community",
      "authority"
    ],
    "outcome": "Higher confidence"
  },
  {
    "id": "credible",
    "name": "This source appears credible",
    "machine": [
      "authority",
      "entity",
      "experience"
    ],
    "outcome": "Reduced perceived risk"
  },
  {
    "id": "local",
    "name": "This is nearby and available",
    "machine": [
      "local",
      "freshness",
      "conversion"
    ],
    "outcome": "Calls and visits"
  },
  {
    "id": "fit",
    "name": "This matches what I need",
    "machine": [
      "product",
      "relevance",
      "structured"
    ],
    "outcome": "Stronger conversion"
  },
  {
    "id": "current",
    "name": "This information appears current",
    "machine": [
      "freshness",
      "reviews",
      "product"
    ],
    "outcome": "Decision confidence"
  },
  {
    "id": "clear",
    "name": "I know what to do next",
    "machine": [
      "conversion",
      "structured",
      "local"
    ],
    "outcome": "Action"
  }
];

export const SAMPLE_JOURNEYS = {
  "breezy": [
    {
      "stage": "trigger",
      "surface": "social",
      "query": "Summer golf trip outfits",
      "reason": "A creator clip creates a style need."
    },
    {
      "stage": "ask",
      "surface": "google",
      "query": "Best golf polos for hot weather",
      "reason": "The user translates inspiration into criteria."
    },
    {
      "stage": "scan",
      "surface": "shopping",
      "query": "Performance golf polo under $100",
      "reason": "Products and prices become comparable."
    },
    {
      "stage": "compare",
      "surface": "youtube",
      "query": "Breezy Golf polo review and fit",
      "reason": "Video demonstrates material and fit."
    },
    {
      "stage": "validate",
      "surface": "reddit",
      "query": "Is Breezy Golf worth it Reddit",
      "reason": "Peer comments reduce brand-claim bias."
    },
    {
      "stage": "act",
      "surface": "site",
      "query": "Breezy product page",
      "reason": "Official details, sizing, shipping, and checkout resolve the purchase."
    }
  ],
  "kp": [
    {
      "stage": "trigger",
      "surface": "ai",
      "query": "Insurance underpaid my storm claim, what now?",
      "reason": "The user needs orientation before selecting a firm."
    },
    {
      "stage": "ask",
      "surface": "google",
      "query": "Property damage attorney Florida",
      "reason": "The problem becomes a service search."
    },
    {
      "stage": "scan",
      "surface": "maps",
      "query": "Property damage lawyer near me",
      "reason": "Local firms, reviews, and actions form a shortlist."
    },
    {
      "stage": "compare",
      "surface": "site",
      "query": "Kanner Pintaluga property damage attorneys",
      "reason": "Practice depth and attorney experience are compared."
    },
    {
      "stage": "validate",
      "surface": "reviews",
      "query": "Kanner Pintaluga reviews",
      "reason": "Independent proof reduces high-stakes risk."
    },
    {
      "stage": "act",
      "surface": "site",
      "query": "Kanner Pintaluga contact",
      "reason": "The user calls or submits a consultation form."
    }
  ]
};

export const SEED_AUDIT_ROWS = [
  {
    "id": "seed-breezy-001",
    "clientKey": "breezy",
    "client": "Breezy Golf",
    "platform": "Google Search",
    "stage": "Scan",
    "moment": "Collection demand",
    "query": "golf polos, performance golf apparel, golf hats, big and tall golf apparel",
    "evidence": "Homepage and nav show broad apparel, hats, gear, big & tall and collection architecture.",
    "currentState": "Strong category inventory exists, but generic SEO sections and navigation do not fully separate intent by golfer type or query use case.",
    "gap": "Category pages can blend together and fail to answer specific search intent like hot-weather polos, big-and-tall, sun-protection hats, or gifts.",
    "recommendation": "Build query-led collection modules with 80-150 word intro, fit/fabric bullets, internal links to best sellers, and FAQs visible on-page.",
    "kpi": "Collection organic clicks and revenue",
    "demand": 5,
    "intent": 5,
    "gapScore": 4,
    "feasibility": 4,
    "trustRisk": 3,
    "score": 87,
    "priority": "High",
    "owner": "SEO + Content",
    "status": "Recommended",
    "sourceUrls": [
      "https://breezygolf.com/",
      "https://breezygolf.com/collections/hats"
    ],
    "seed": true
  },
  {
    "id": "seed-breezy-002",
    "clientKey": "breezy",
    "client": "Breezy Golf",
    "platform": "Google Search",
    "stage": "Validate",
    "moment": "Branded trust",
    "query": "is Breezy Golf worth it, Breezy Golf reviews, Breezy Golf quality",
    "evidence": "Breezy has a June 2026 blog post explicitly targeting worth/review/quality validation language.",
    "currentState": "Good page exists, but could become a central validation hub linked from PDPs and creator surfaces.",
    "gap": "Validation search can leak to third-party reviews before Breezy frames quality, fit, price and return policy itself.",
    "recommendation": "Upgrade blog into a durable buyer-confidence page with comparison table, review themes, best-fit buyers, shipping/returns, and PDP links.",
    "kpi": "Branded validation CTR and assisted revenue",
    "demand": 5,
    "intent": 5,
    "gapScore": 4,
    "feasibility": 5,
    "trustRisk": 4,
    "score": 93,
    "priority": "High",
    "owner": "SEO + Content",
    "status": "Recommended",
    "sourceUrls": [
      "https://breezygolf.com/blogs/breezy-blog/is-breezy-golf-worth-it",
      "https://breezygolf.com/blogs/breezy-blog"
    ],
    "seed": true
  },
  {
    "id": "seed-breezy-003",
    "clientKey": "breezy",
    "client": "Breezy Golf",
    "platform": "Google Shopping / AI",
    "stage": "Act",
    "moment": "Product facts",
    "query": "price, availability, size, material, review, shipping, return policy",
    "evidence": "Product pages expose price, sizes, material, care, returns, reviews, and Add to Cart flows.",
    "currentState": "Google/AI visibility depends on clean, consistent Product/Offer/Review facts; some product pages appear to repeat generic brand copy.",
    "gap": "Audit Product, Offer, AggregateRating, Review, MerchantReturnPolicy, shipping details and variants against page-visible facts.",
    "recommendation": "Run product structured data QA across top PDPs and add missing fields where compliant.",
    "kpi": "Merchant listing eligibility, rich result warnings, PDP conversion rate",
    "demand": 5,
    "intent": 5,
    "gapScore": 5,
    "feasibility": 3,
    "trustRisk": 4,
    "score": 90,
    "priority": "High",
    "owner": "Technical SEO",
    "status": "Needs Validation",
    "sourceUrls": [
      "https://breezygolf.com/products/the-throwin-darts-polo",
      "https://developers.google.com/search/updates"
    ],
    "seed": true
  },
  {
    "id": "seed-breezy-004",
    "clientKey": "breezy",
    "client": "Breezy Golf",
    "platform": "Reviews",
    "stage": "Validate",
    "moment": "Review integrity",
    "query": "verified reviews, product ratings, first-party review trust",
    "evidence": "Several PDPs show strong review blocks; one product snippet surfaced an apparent review display inconsistency: 'Based on 1 review' with '200% (2).'",
    "currentState": "Review display errors undermine trust and can confuse search engines and users.",
    "gap": "Review data must be visibly accurate, compliant and consistent before relying on stars as proof.",
    "recommendation": "Audit review app output for duplicate counts, percent math, incentive disclosure, and product-level alignment.",
    "kpi": "Review accuracy, review-rich engagement, compliance pass rate",
    "demand": 4,
    "intent": 5,
    "gapScore": 5,
    "feasibility": 4,
    "trustRisk": 5,
    "score": 92,
    "priority": "High",
    "owner": "Technical SEO + CX",
    "status": "High Priority",
    "sourceUrls": [
      "https://breezygolf.com/products/the-throwin-darts-polo",
      "https://developers.google.com/search/updates"
    ],
    "seed": true
  },
  {
    "id": "seed-breezy-005",
    "clientKey": "breezy",
    "client": "Breezy Golf",
    "platform": "Reddit / Forums",
    "stage": "Validate",
    "moment": "Community proof",
    "query": "Breezy Golf Reddit, Breezy sizing, Breezy price, is this golf apparel store legit",
    "evidence": "Direct Breezy-specific Reddit coverage was limited in this public audit. General ecommerce discussions on Reddit repeatedly flag generic design, inconsistent product imagery, weak or questionable reviews, limited About/contact information, unclear policies, and poor mobile experience as reasons shoppers distrust unfamiliar stores. These themes are directional category VOC, not Breezy sentiment.",
    "currentState": "No defensible brand-specific Reddit consensus was found. Breezy should treat community evidence as a hypothesis source and validate themes through ongoing monitoring, first-party reviews, customer service data, and conversion behavior.",
    "gap": "Without a repeatable VOC process, the team may overreact to isolated comments or miss recurring trust and fit questions.",
    "recommendation": "Create a monitored Reddit/forum query set covering brand legitimacy, quality, price, fit, sizing, stock, shipping, returns, and competitor comparisons. Label every observation as brand-specific, category-level, or hypothesis before using it in strategy.",
    "kpi": "VOC themes captured, new content briefs, branded search conversion",
    "demand": 4,
    "intent": 4,
    "gapScore": 4,
    "feasibility": 5,
    "trustRisk": 3,
    "score": 82,
    "priority": "High",
    "owner": "SEO Strategy",
    "status": "Recommended",
    "sourceUrls": [
      "https://hr.reddit.com/r/dropshipping/comments/1t63i3q/why_your_shopify_store_looks_scammy_in_2026_even/",
      "https://es.reddit.com/r/shopify_hustlers/comments/1plrh4s/common_shopify_mistakes_i_keep_seeing_in_live/",
      "https://support.reddithelp.com/hc/en-us/articles/32026729424916-Reddit-s-AI-search"
    ],
    "seed": true
  },
  {
    "id": "seed-breezy-006",
    "clientKey": "breezy",
    "client": "Breezy Golf",
    "platform": "YouTube",
    "stage": "Validate",
    "moment": "Creator proof",
    "query": "Bob Does Sports Breezy apparel, Breezy polo review, golf outfit video",
    "evidence": "Breezy brand is explicitly tied to Bob Does Sports and creator personalities on the site.",
    "currentState": "The creator relationship is likely a major search driver but may not be connected strongly enough to PDPs, collections, and searchable transcripts.",
    "gap": "Video proof can be a higher-trust layer than product copy alone.",
    "recommendation": "Create a creator/entity hub linking key creators, videos, products, bundles, and searchable transcripts or clips.",
    "kpi": "YouTube search traffic, PDP assisted clicks, video-to-product CTR",
    "demand": 5,
    "intent": 4,
    "gapScore": 4,
    "feasibility": 3,
    "trustRisk": 2,
    "score": 76,
    "priority": "Medium",
    "owner": "Content + Social Strategy",
    "status": "Recommended",
    "sourceUrls": [
      "https://breezygolf.com/",
      "https://breezygolf.com/pages/about-us"
    ],
    "seed": true
  },
  {
    "id": "seed-breezy-007",
    "clientKey": "breezy",
    "client": "Breezy Golf",
    "platform": "TikTok / Instagram Search",
    "stage": "Ask",
    "moment": "Visual search",
    "query": "golf trip outfits, funny golf polos, men’s golf outfits, summer golf outfit",
    "evidence": "TikTok Search Ads now support keyword expansion from creatives and product data, showing the platform’s query-led behavior.",
    "currentState": "Breezy’s best search moments on social are likely product/creator/style intent, not generic posting.",
    "gap": "If captions and clips are not query-led, short-form content will entertain but not capture search demand.",
    "recommendation": "Build 20-search-phrase creator brief: fit check, summer round, scramble outfit, big-and-tall fit, gift under $100, bundle review.",
    "kpi": "Saves, profile clicks, tagged sessions, branded search lift",
    "demand": 4,
    "intent": 4,
    "gapScore": 4,
    "feasibility": 3,
    "trustRisk": 2,
    "score": 72,
    "priority": "Medium",
    "owner": "Social Strategy",
    "status": "Recommended",
    "sourceUrls": [
      "https://ads.tiktok.com/help/article/about-automated-keywords-for-search-ads-campaigns",
      "https://breezygolf.com/pages/about-us"
    ],
    "seed": true
  },
  {
    "id": "seed-breezy-008",
    "clientKey": "breezy",
    "client": "Breezy Golf",
    "platform": "On-site Search",
    "stage": "Act",
    "moment": "Product narrowing",
    "query": "size, color, hat type, polo fit, 5XL",
    "evidence": "Hats collection exposes filters by color, size, product type, and sort order.",
    "currentState": "Filters help users, but indexation/crawl rules for filtered URLs need verification to avoid crawl bloat or thin pages.",
    "gap": "Faceted navigation can help UX while hurting crawl quality if unmanaged.",
    "recommendation": "Audit collection filters, canonical handling, noindex/robots strategy, internal linking, and site-search behavior.",
    "kpi": "Crawl waste reduction, indexed collection quality, collection conversion",
    "demand": 4,
    "intent": 4,
    "gapScore": 5,
    "feasibility": 3,
    "trustRisk": 3,
    "score": 79,
    "priority": "Medium",
    "owner": "Technical SEO",
    "status": "Needs Validation",
    "sourceUrls": [
      "https://breezygolf.com/collections/hats",
      "https://developers.google.com/search/docs/fundamentals/how-search-works"
    ],
    "seed": true
  },
  {
    "id": "seed-breezy-009",
    "clientKey": "breezy",
    "client": "Breezy Golf",
    "platform": "Google Search",
    "stage": "Compare",
    "moment": "Comparison demand",
    "query": "Breezy vs Rhoback, Breezy vs Bad Birdie, Breezy vs Peter Millar",
    "evidence": "Third-party review mentions comparisons against Rhoback/Peter Millar; product users likely compare style and price.",
    "currentState": "Breezy does not appear to own structured competitor comparison pages from public evidence.",
    "gap": "Comparison searches are high-intent and will happen offsite unless Breezy participates transparently.",
    "recommendation": "Create editorial comparison pages with fair tables: price, fabric, fit, sizing, style, returns, best buyer fit.",
    "kpi": "Comparison rankings, assisted revenue, branded click share",
    "demand": 4,
    "intent": 5,
    "gapScore": 5,
    "feasibility": 3,
    "trustRisk": 3,
    "score": 84,
    "priority": "High",
    "owner": "SEO + Content",
    "status": "Recommended",
    "sourceUrls": [
      "https://threeputtgolfclothing.co.uk/blogs/news/breezy-golf-clothing-review",
      "https://breezygolf.com/blogs/breezy-blog/is-breezy-golf-worth-it"
    ],
    "seed": true
  },
  {
    "id": "seed-breezy-010",
    "clientKey": "breezy",
    "client": "Breezy Golf",
    "platform": "AI Answers",
    "stage": "Compare",
    "moment": "AI recommendations",
    "query": "best golf polos with personality, is Breezy Golf legit, Breezy Golf sizing",
    "evidence": "Google has started testing dedicated generative AI performance reporting in Search Console; Reddit AI search is also now unified with Reddit search.",
    "currentState": "AI answer inclusion will depend on clear product/entity facts plus outside validation signals.",
    "gap": "Breezy needs fact consistency across site, reviews, creators, and third-party references to avoid vague or inaccurate AI summaries.",
    "recommendation": "Create AI answer readiness tracker with prompts, expected answer, cited sources, fact gaps, and remediation owner.",
    "kpi": "Prompt visibility score, citation share, fact accuracy",
    "demand": 4,
    "intent": 5,
    "gapScore": 5,
    "feasibility": 3,
    "trustRisk": 4,
    "score": 86,
    "priority": "High",
    "owner": "SEO Strategy",
    "status": "Recommended",
    "sourceUrls": [
      "https://developers.google.com/search/blog/2026/06/gen-ai-performance-reports",
      "https://support.reddithelp.com/hc/en-us/articles/32026729424916-Reddit-s-AI-search",
      "https://breezygolf.com/"
    ],
    "seed": true
  },
  {
    "id": "seed-breezy-011",
    "clientKey": "breezy",
    "client": "Breezy Golf",
    "platform": "Product UX",
    "stage": "Act",
    "moment": "Restock and drop behavior",
    "query": "sold out Breezy polo, notify me, limited drop",
    "evidence": "Multiple products show Notify me/back-in-stock and limited seasonal/drop language.",
    "currentState": "Stockouts are part of the brand model but create searcher frustration if no alternatives or restock timelines exist.",
    "gap": "Unresolved stockout journeys leak demand to competitors or secondary marketplaces.",
    "recommendation": "Add restock modules: comparable alternatives, creator picks, expected restock CTA, email/SMS segmentation.",
    "kpi": "Notify-me conversion, substitute product revenue, stockout exit rate",
    "demand": 4,
    "intent": 4,
    "gapScore": 4,
    "feasibility": 4,
    "trustRisk": 2,
    "score": 76,
    "priority": "Medium",
    "owner": "CX + Merchandising",
    "status": "Recommended",
    "sourceUrls": [
      "https://breezygolf.com/products/the-throwin-darts-polo",
      "https://breezygolf.com/pages/about-us"
    ],
    "seed": true
  },
  {
    "id": "seed-breezy-012",
    "clientKey": "breezy",
    "client": "Breezy Golf",
    "platform": "Google Images / Shopping",
    "stage": "Scan",
    "moment": "Visual product search",
    "query": "green golf polo, rope hat, Bob Does Sports hat",
    "evidence": "Search snippets show repeated generic image alt text such as 'Breezy Golf | Performance Golf Apparel.'",
    "currentState": "Generic alt text limits visual search and image understanding for product-specific queries.",
    "gap": "Product images need descriptive names/alt attributes tied to product, color, style, and use case.",
    "recommendation": "Audit top PDP media for descriptive alt text, filename hygiene, product image schema, and image sitemap eligibility.",
    "kpi": "Image impressions, PDP clicks from image/search, rich results",
    "demand": 3,
    "intent": 4,
    "gapScore": 4,
    "feasibility": 4,
    "trustRisk": 2,
    "score": 72,
    "priority": "Medium",
    "owner": "Technical SEO",
    "status": "Recommended",
    "sourceUrls": [
      "https://breezygolf.com/",
      "https://breezygolf.com/products/the-throwin-darts-polo"
    ],
    "seed": true
  },
  {
    "id": "seed-breezy-013",
    "clientKey": "breezy",
    "client": "Breezy Golf",
    "platform": "Content",
    "stage": "Ask",
    "moment": "Gift and seasonal demand",
    "query": "Father’s Day golf gifts, golf gifts under $100, summer golf outfits",
    "evidence": "Breezy Blog includes gift and seasonal posts in 2026.",
    "currentState": "Content exists but needs tighter internal linking into collections/PDPs and reusable templates for seasonal peaks.",
    "gap": "Seasonal content loses value if not linked into current collections and updated before demand peaks.",
    "recommendation": "Create seasonal hub templates with product blocks, creator picks, price bands, and update dates.",
    "kpi": "Blog-assisted revenue, seasonal rankings, internal link CTR",
    "demand": 4,
    "intent": 4,
    "gapScore": 3,
    "feasibility": 5,
    "trustRisk": 1,
    "score": 73,
    "priority": "Medium",
    "owner": "Content",
    "status": "Recommended",
    "sourceUrls": [
      "https://breezygolf.com/blogs/breezy-blog"
    ],
    "seed": true
  },
  {
    "id": "seed-breezy-014",
    "clientKey": "breezy",
    "client": "Breezy Golf",
    "platform": "Entity / Brand",
    "stage": "Validate",
    "moment": "Creator entity clarity",
    "query": "Bob Does Sports Breezy, Bobby Fairways, Fat Perez, Joey Cold Cuts apparel",
    "evidence": "Homepage and About pages mention creator names and brand origin.",
    "currentState": "The creator/brand relationship may not be structured as an entity graph with sameAs links, profiles, videos, and products.",
    "gap": "AI and search engines need consistent entity links to understand creator-to-product relevance.",
    "recommendation": "Build Brand + Creator entity hub with Organization, Person, sameAs, product collections, video embeds, and internal links.",
    "kpi": "Entity panel accuracy, branded query coverage, creator-assisted revenue",
    "demand": 4,
    "intent": 4,
    "gapScore": 4,
    "feasibility": 3,
    "trustRisk": 3,
    "score": 74,
    "priority": "Medium",
    "owner": "Technical SEO + Content",
    "status": "Recommended",
    "sourceUrls": [
      "https://breezygolf.com/",
      "https://breezygolf.com/pages/about-us",
      "https://developers.google.com/search/docs/appearance/structured-data/organization"
    ],
    "seed": true
  },
  {
    "id": "seed-breezy-015",
    "clientKey": "breezy",
    "client": "Breezy Golf",
    "platform": "International Search",
    "stage": "Compare",
    "moment": "International buyer uncertainty",
    "query": "Breezy Golf UK, Breezy Golf shipping, customs fees",
    "evidence": "Third-party review notes UK distribution and customs concern for direct US purchases.",
    "currentState": "International users need confidence before conversion.",
    "gap": "Searchers may abandon if customs, shipping times, and returns are unclear.",
    "recommendation": "Add geo-aware shipping/return copy, UK stockist links if approved, and shipping schema/merchant policies.",
    "kpi": "International conversion, shipping FAQ engagement, checkout abandonment",
    "demand": 3,
    "intent": 4,
    "gapScore": 3,
    "feasibility": 3,
    "trustRisk": 2,
    "score": 63,
    "priority": "Low",
    "owner": "SEO + Merchandising",
    "status": "Needs Validation",
    "sourceUrls": [
      "https://threeputtgolfclothing.co.uk/blogs/news/breezy-golf-clothing-review",
      "https://developers.google.com/search/updates"
    ],
    "seed": true
  },
  {
    "id": "seed-breezy-016",
    "clientKey": "breezy",
    "client": "Breezy Golf",
    "platform": "Technical SEO",
    "stage": "Ask",
    "moment": "Crawler and AI access",
    "query": "can Google and AI systems access product content?",
    "evidence": "Google requires accessible 200 pages with indexable content; Googlebot renders JavaScript with a recent Chrome.",
    "currentState": "Shopify/ecommerce pages often rely on JS, apps and filters; crawl/access verification is required.",
    "gap": "Without crawler verification, Search Everywhere recommendations can miss technical blockers.",
    "recommendation": "Run priority URL tests: robots, status, canonical, rendered HTML, structured data, pagination, indexability, AI crawler policy.",
    "kpi": "Indexability pass rate, schema validation, crawl errors",
    "demand": 5,
    "intent": 5,
    "gapScore": 4,
    "feasibility": 4,
    "trustRisk": 3,
    "score": 87,
    "priority": "High",
    "owner": "Technical SEO",
    "status": "Needs Validation",
    "sourceUrls": [
      "https://developers.google.com/search/docs/essentials/technical",
      "https://developers.google.com/search/docs/fundamentals/how-search-works"
    ],
    "seed": true
  },
  {
    "id": "seed-breezy-017",
    "clientKey": "breezy",
    "client": "Breezy Golf",
    "platform": "Conversion",
    "stage": "Act",
    "moment": "PDP confidence",
    "query": "what size should I buy, return policy, material, care",
    "evidence": "PDPs include materials, care and return/exchange info.",
    "currentState": "Helpful facts are present but often placed in similar repeating blocks, which can feel templated and not confidence-building.",
    "gap": "PDP confidence modules should answer the most common late-stage objections quickly.",
    "recommendation": "Add concise PDP proof stack: fit notes, model info, reviews by size, return reassurance, material icons, stock/restock guidance.",
    "kpi": "Add-to-cart rate, PDP scroll/click events, return rate",
    "demand": 5,
    "intent": 5,
    "gapScore": 4,
    "feasibility": 4,
    "trustRisk": 2,
    "score": 85,
    "priority": "High",
    "owner": "CX + Content",
    "status": "Recommended",
    "sourceUrls": [
      "https://breezygolf.com/products/the-throwin-darts-polo",
      "https://breezygolf.com/pages/about-us"
    ],
    "seed": true
  },
  {
    "id": "seed-breezy-018",
    "clientKey": "breezy",
    "client": "Breezy Golf",
    "platform": "Reddit / Forums",
    "stage": "Learn / Share",
    "moment": "Demand gap mining",
    "query": "women's Breezy Golf, Breezy sizing, price, restock",
    "evidence": "General Shopify feedback threads on Reddit repeatedly call out weak hero messaging, limited testimonials, confusing navigation, low-quality media, and missing trust information. These are useful category-level prompts for testing Breezy, not evidence that Breezy has each problem.",
    "currentState": "Community discussions can surface friction language, but product requests and store critiques must be separated from verified Breezy findings.",
    "gap": "Community comments can become roadmap noise when category-level complaints are mistaken for brand-specific evidence.",
    "recommendation": "Use a VOC intake taxonomy: brand-specific evidence, category pattern, competitor mention, product request, trust concern, UX concern, or hypothesis. Only promote themes after corroboration.",
    "kpi": "Qualified opportunity backlog, client acceptance rate",
    "demand": 3,
    "intent": 3,
    "gapScore": 4,
    "feasibility": 5,
    "trustRisk": 2,
    "score": 71,
    "priority": "Medium",
    "owner": "SEO Strategy",
    "status": "Recommended",
    "sourceUrls": [
      "https://es.reddit.com/r/shopify_hustlers/comments/1plrh4s/common_shopify_mistakes_i_keep_seeing_in_live/",
      "https://redditinc.com/news/introducing-reddit-answers"
    ],
    "seed": true
  },
  {
    "id": "seed-breezy-019",
    "clientKey": "breezy",
    "client": "Breezy Golf",
    "platform": "Reviews / Reputation",
    "stage": "Validate",
    "moment": "Third-party trust",
    "query": "Breezy Golf legit, Breezy Golf scam, is breezygolf.com safe",
    "evidence": "Some third-party trust-check sites appear for legitimacy queries and may be low-quality but visible.",
    "currentState": "Even questionable trust pages can influence anxious buyers if brand-owned proof is thin.",
    "gap": "Breezy should own legitimacy and support answers clearly before weak third-party pages frame the discussion.",
    "recommendation": "Create a trust/FAQ section: official store, returns, support email, shipping, privacy, review policy, authorized retailers.",
    "kpi": "Branded SERP sentiment, support page clicks, conversion from branded queries",
    "demand": 4,
    "intent": 4,
    "gapScore": 4,
    "feasibility": 4,
    "trustRisk": 4,
    "score": 80,
    "priority": "Medium",
    "owner": "SEO + CX",
    "status": "Recommended",
    "sourceUrls": [
      "https://breezygolf.com/",
      "https://breezygolf.com/blogs/breezy-blog/is-breezy-golf-worth-it"
    ],
    "seed": true
  },
  {
    "id": "seed-breezy-020",
    "clientKey": "breezy",
    "client": "Breezy Golf",
    "platform": "Internal Linking",
    "stage": "Compare",
    "moment": "Product path continuity",
    "query": "blog to PDP, collection to PDP, creator to product",
    "evidence": "Blog and product content both exist; Homepage showcases major collections and brand story.",
    "currentState": "The journey from learning to buying may not be tightly linked by query intent.",
    "gap": "A Search Everywhere journey only works if each surface routes users to the next proof/action step.",
    "recommendation": "Build internal link rules: every buyer guide links to collection/PDPs; every PDP links to relevant guide, creator proof and returns; collection links to FAQ.",
    "kpi": "Internal CTR, assisted revenue, crawl path depth",
    "demand": 4,
    "intent": 4,
    "gapScore": 3,
    "feasibility": 5,
    "trustRisk": 1,
    "score": 73,
    "priority": "Medium",
    "owner": "SEO",
    "status": "Recommended",
    "sourceUrls": [
      "https://breezygolf.com/blogs/breezy-blog",
      "https://breezygolf.com/"
    ],
    "seed": true
  },
  {
    "id": "seed-breezy-021",
    "clientKey": "breezy",
    "client": "Breezy Golf",
    "platform": "Measurement",
    "stage": "Learn / Share",
    "moment": "Attribution model",
    "query": "Which non-Google surface influenced purchase?",
    "evidence": "Search Everywhere includes platforms with uneven measurement granularity.",
    "currentState": "Current public data cannot confirm revenue impact from Reddit, YouTube, TikTok, reviews or AI answers.",
    "gap": "A channel-only dashboard will undercount validation moments.",
    "recommendation": "Create measurement matrix separating measured clicks, directional signals, and qualitative intelligence.",
    "kpi": "Dashboard adoption, attribution coverage, monthly insights delivered",
    "demand": 5,
    "intent": 4,
    "gapScore": 4,
    "feasibility": 4,
    "trustRisk": 2,
    "score": 80,
    "priority": "Medium",
    "owner": "Analytics",
    "status": "Recommended",
    "sourceUrls": [
      "https://developers.google.com/search/blog/2026/06/gen-ai-performance-reports",
      "https://ads.tiktok.com/help/article/about-automated-keywords-for-search-ads-campaigns",
      "https://support.reddithelp.com/hc/en-us/articles/32026729424916-Reddit-s-AI-search"
    ],
    "seed": true
  },
  {
    "id": "seed-breezy-022",
    "clientKey": "breezy",
    "client": "Breezy Golf",
    "platform": "Product UX",
    "stage": "Act",
    "moment": "Bundles and subscription copy",
    "query": "bundle, deal, save 20%, Caddylac bundle",
    "evidence": "Caddylac bundle search result included copy about deferred/subscription/recurring purchase, which is unusual for a bundle product.",
    "currentState": "Misplaced subscription copy can create purchase anxiety and legal/compliance friction.",
    "gap": "Audit Shopify product templates and payment app copy for product-type mismatches.",
    "recommendation": "Fix template logic so bundles do not show subscription/deferred language unless truly applicable.",
    "kpi": "Checkout confidence, PDP error rate, support tickets",
    "demand": 4,
    "intent": 5,
    "gapScore": 5,
    "feasibility": 4,
    "trustRisk": 4,
    "score": 90,
    "priority": "High",
    "owner": "CX + Dev",
    "status": "High Priority",
    "sourceUrls": [
      "https://breezygolf.com/pages/about-us"
    ],
    "seed": true
  },
  {
    "id": "seed-breezy-023",
    "clientKey": "breezy",
    "client": "Breezy Golf",
    "platform": "Google Search",
    "stage": "Ask",
    "moment": "Big and tall demand",
    "query": "big and tall golf polos, 5XL golf polos, big guy golf clothes",
    "evidence": "Homepage and About emphasize big-and-tall coverage and many items up to 5XL.",
    "currentState": "This is a distinct high-intent audience that deserves its own query cluster and collection experience.",
    "gap": "Generic apparel pages may not satisfy sizing-specific searchers.",
    "recommendation": "Create/optimize Big & Tall hub with size inventory, fit guidance, creator fit proof, reviews by body type, and internal links.",
    "kpi": "Big & Tall organic sessions and revenue",
    "demand": 4,
    "intent": 5,
    "gapScore": 4,
    "feasibility": 4,
    "trustRisk": 2,
    "score": 81,
    "priority": "Medium",
    "owner": "SEO + Merchandising",
    "status": "Recommended",
    "sourceUrls": [
      "https://breezygolf.com/",
      "https://breezygolf.com/pages/about-us"
    ],
    "seed": true
  },
  {
    "id": "seed-breezy-024",
    "clientKey": "breezy",
    "client": "Breezy Golf",
    "platform": "Search Everywhere Governance",
    "stage": "Learn / Share",
    "moment": "Team operating model",
    "query": "Who owns each search surface?",
    "evidence": "Breezy opportunities span SEO, social strategy, merchandising, CX, analytics, and technical SEO.",
    "currentState": "Without owner mapping, Search Everywhere becomes a strategy deck instead of an operating system.",
    "gap": "Make every opportunity actionable with owner, source, data need and next step.",
    "recommendation": "Use workbook as living backlog with priority, owner, status and evidence columns.",
    "kpi": "Backlog completion, owner response, delivered recommendations",
    "demand": 5,
    "intent": 4,
    "gapScore": 5,
    "feasibility": 5,
    "trustRisk": 2,
    "score": 89,
    "priority": "High",
    "owner": "SEO Lead",
    "status": "Recommended",
    "sourceUrls": [
      "https://breezygolf.com/",
      "https://developers.google.com/search/blog/2026/06/gen-ai-performance-reports"
    ],
    "seed": true
  },
  {
    "id": "seed-kp-001",
    "clientKey": "kp",
    "client": "Kanner & Pintaluga",
    "platform": "Google Search",
    "stage": "Scan",
    "moment": "Entity and geography",
    "query": "Kanner & Pintaluga Florida property damage attorney, Texas personal injury lawyer",
    "evidence": "Homepage title/snippet positions K&P as PI and FL property damage, but the visible hero references Texas PI.",
    "currentState": "This creates geography/entity ambiguity for users and search/AI systems.",
    "gap": "Hero, metadata, internal copy and schema need to align around the current priority state and practice area.",
    "recommendation": "Clarify homepage entity hierarchy: national firm, Florida roots, Texas page if targeted, practice area pathways.",
    "kpi": "Organic CTR, branded query accuracy, AI answer fact accuracy",
    "demand": 5,
    "intent": 5,
    "gapScore": 5,
    "feasibility": 4,
    "trustRisk": 5,
    "score": 96,
    "priority": "High",
    "owner": "SEO + Content",
    "status": "High Priority",
    "sourceUrls": [
      "https://kpattorney.com/",
      "https://developers.google.com/search/docs/appearance/structured-data/organization"
    ],
    "seed": true
  },
  {
    "id": "seed-kp-002",
    "clientKey": "kp",
    "client": "Kanner & Pintaluga",
    "platform": "Google Maps / Local",
    "stage": "Act",
    "moment": "Office validation",
    "query": "personal injury lawyer near me, property damage attorney Boca Raton, Kanner Pintaluga Miami",
    "evidence": "Florida locations list contains many offices, appointment-only locations, satellite notes and repeated/shared addresses.",
    "currentState": "Distributed offices create NAP, category, pin, hours and service-area governance risk.",
    "gap": "Local results require consistent office facts and user-visible office expectations.",
    "recommendation": "Create office governance sheet: GBP URL, canonical location URL, NAP, category, appointment status, attorney/service coverage, schema.",
    "kpi": "GBP calls, direction requests, location page leads",
    "demand": 5,
    "intent": 5,
    "gapScore": 5,
    "feasibility": 3,
    "trustRisk": 5,
    "score": 92,
    "priority": "High",
    "owner": "Local SEO",
    "status": "High Priority",
    "sourceUrls": [
      "https://kpattorney.com/offices/florida/",
      "https://developers.google.com/search/docs/appearance/structured-data/local-business"
    ],
    "seed": true
  },
  {
    "id": "seed-kp-003",
    "clientKey": "kp",
    "client": "Kanner & Pintaluga",
    "platform": "AI Answers",
    "stage": "Validate",
    "moment": "Firm fact accuracy",
    "query": "how many states does Kanner Pintaluga serve, K&P attorney count",
    "evidence": "Contact page says 18 states; offices page lists many states; older Houston news says 13 states at the time.",
    "currentState": "Inconsistent footprint claims can cause AI answers and users to repeat stale or conflicting facts.",
    "gap": "A single source of truth is needed for state count, office count, attorney count and employee count.",
    "recommendation": "Create entity fact registry powering homepage, firm page, schema, press boilerplate and office pages.",
    "kpi": "AI answer accuracy, brand fact consistency, fewer conflicting claims",
    "demand": 4,
    "intent": 5,
    "gapScore": 5,
    "feasibility": 4,
    "trustRisk": 5,
    "score": 92,
    "priority": "High",
    "owner": "SEO + Legal/Comms",
    "status": "High Priority",
    "sourceUrls": [
      "https://kpattorney.com/contact-us/",
      "https://kpattorney.com/offices/",
      "https://kpattorney.com/news/kanner-pintaluga-expands-presence-in-texas-opens-8000-sq-ft-office-in-houston-to-support-growing-client-demand/"
    ],
    "seed": true
  },
  {
    "id": "seed-kp-004",
    "clientKey": "kp",
    "client": "Kanner & Pintaluga",
    "platform": "Google Search",
    "stage": "Ask",
    "moment": "Practice area demand",
    "query": "car accident lawyer, hurricane damage lawyer, roof damage attorney, slip and fall lawyer",
    "evidence": "Homepage lists major PI and property damage practice areas with outcomes and proof.",
    "currentState": "Practice links exist, but query intent varies sharply by case type, urgency and state.",
    "gap": "General practice copy can underserve high-intent local/state queries.",
    "recommendation": "Build practice-area clusters with local modifiers, proof modules, attorney teams, FAQs, and conversion paths.",
    "kpi": "Practice page leads and rankings",
    "demand": 5,
    "intent": 5,
    "gapScore": 4,
    "feasibility": 4,
    "trustRisk": 4,
    "score": 89,
    "priority": "High",
    "owner": "SEO + Content",
    "status": "Recommended",
    "sourceUrls": [
      "https://kpattorney.com/",
      "https://kpattorney.com/personal-injury/premises-liability/"
    ],
    "seed": true
  },
  {
    "id": "seed-kp-005",
    "clientKey": "kp",
    "client": "Kanner & Pintaluga",
    "platform": "Spanish Search",
    "stage": "Ask",
    "moment": "Bilingual legal demand",
    "query": "abogado de accidente, abogado daños propiedad, consulta gratis abogado",
    "evidence": "K&P has Spanish pages for home/contact/locations.",
    "currentState": "Spanish pages show translation/local-name issues in public snippets, including awkward location translations.",
    "gap": "Poor Spanish localization damages trust at the exact moment users need reassurance.",
    "recommendation": "Run Spanish localization QA for legal accuracy, local place names, CTAs, schema language tags and conversion forms.",
    "kpi": "Spanish organic leads, Spanish page conversion, quality review pass rate",
    "demand": 4,
    "intent": 5,
    "gapScore": 5,
    "feasibility": 3,
    "trustRisk": 5,
    "score": 88,
    "priority": "High",
    "owner": "SEO + Content + Legal",
    "status": "High Priority",
    "sourceUrls": [
      "https://kpattorney.com/es/",
      "https://kpattorney.com/offices/florida/"
    ],
    "seed": true
  },
  {
    "id": "seed-kp-006",
    "clientKey": "kp",
    "client": "Kanner & Pintaluga",
    "platform": "Reddit / Forums",
    "stage": "Validate",
    "moment": "Legal concern mining",
    "query": "public adjuster vs lawyer, denied insurance claim lawyer, should I hire attorney after car accident",
    "evidence": "Direct community discussions about disputed accident fault and renters-insurance claims emphasize evidence collection, insurer distrust, documentation, coverage uncertainty, temporary housing, damaged-property reimbursement, and when to seek professional help. These are directional claimant anxieties, not Kanner & Pintaluga sentiment or legal advice.",
    "currentState": "K&P should use Reddit and forums for objection mining and question research, not broad promotional posting or unsupported legal guidance.",
    "gap": "Owned content may miss the plain-language fears and evidence questions that appear before a searcher is ready to contact a law firm.",
    "recommendation": "Build a legally reviewed VOC workflow for disputed fault, denied or underpaid claims, documentation, adjuster interactions, temporary housing, medical bills, public adjusters, timelines, and escalation questions. Corroborate themes before publishing.",
    "kpi": "VOC themes captured, content briefs, improved FAQ engagement",
    "demand": 5,
    "intent": 4,
    "gapScore": 4,
    "feasibility": 5,
    "trustRisk": 4,
    "score": 88,
    "priority": "High",
    "owner": "SEO Strategy",
    "status": "Recommended",
    "sourceUrls": [
      "https://ja.reddit.com/r/Wellthatsucks/comments/1puotlo/someone_switched_lanes_and_hit_my_car_their/",
      "https://vi.reddit.com/r/boston/comments/1itconh/beware_of_lemonade_renters_insurance/",
      "https://support.reddithelp.com/hc/en-us/articles/32026729424916-Reddit-s-AI-search"
    ],
    "seed": true
  },
  {
    "id": "seed-kp-007",
    "clientKey": "kp",
    "client": "Kanner & Pintaluga",
    "platform": "Google Search / AI",
    "stage": "Validate",
    "moment": "Attorney proof",
    "query": "Who will handle my case? attorney credentials, board certified trial lawyer",
    "evidence": "Attorney bios include detailed credentials, practice areas, admissions, defense-side experience and trial experience.",
    "currentState": "Bio facts may not be systematically connected to relevant practice/location pages and schema.",
    "gap": "In legal search, users and AI systems need clear named expert proof for each case type and state.",
    "recommendation": "Add attorney proof modules to practice/location pages and implement Person/Attorney schema where appropriate.",
    "kpi": "Bio-assisted leads, practice page engagement, AI citation accuracy",
    "demand": 5,
    "intent": 5,
    "gapScore": 4,
    "feasibility": 3,
    "trustRisk": 5,
    "score": 87,
    "priority": "High",
    "owner": "SEO + Legal",
    "status": "High Priority",
    "sourceUrls": [
      "https://kpattorney.com/firm/attorneys/richard-g-leonardis/",
      "https://kpattorney.com/firm/",
      "https://developers.google.com/search/docs/appearance/structured-data/organization"
    ],
    "seed": true
  },
  {
    "id": "seed-kp-008",
    "clientKey": "kp",
    "client": "Kanner & Pintaluga",
    "platform": "Reviews / Reputation",
    "stage": "Validate",
    "moment": "Review confidence",
    "query": "Kanner Pintaluga reviews, best personal injury lawyer reviews",
    "evidence": "Homepage includes client testimonials and proof, but Search Everywhere decisions also happen through Google reviews and third-party platforms.",
    "currentState": "If on-site testimonials, GBP reviews and schema are not governed together, trust signals fragment.",
    "gap": "Legal/services reviews must be genuine, visible and compliant; review snippet guidelines have tightened.",
    "recommendation": "Build review governance: office/practice tagging, response playbook, visible review source, no undisclosed incentives, schema QA.",
    "kpi": "Review rating trend, review response rate, lead conversion",
    "demand": 5,
    "intent": 5,
    "gapScore": 4,
    "feasibility": 3,
    "trustRisk": 5,
    "score": 87,
    "priority": "High",
    "owner": "Local SEO + Reputation",
    "status": "High Priority",
    "sourceUrls": [
      "https://kpattorney.com/",
      "https://developers.google.com/search/updates"
    ],
    "seed": true
  },
  {
    "id": "seed-kp-009",
    "clientKey": "kp",
    "client": "Kanner & Pintaluga",
    "platform": "Conversion",
    "stage": "Act",
    "moment": "Urgent intake",
    "query": "call a lawyer now, free consultation, 24/7 accident hotline",
    "evidence": "Contact page clearly offers 24/7 help, free consultation, no upfront cost and digital signing.",
    "currentState": "This is strong, but the journey should be repeated on high-intent pages with clear next-step expectations.",
    "gap": "Users hesitate when they do not know what happens after a form/call.",
    "recommendation": "Add 'What happens in the first 10 minutes' modules on top practice and location pages.",
    "kpi": "Call clicks, form starts, form completion, intake quality",
    "demand": 5,
    "intent": 5,
    "gapScore": 3,
    "feasibility": 5,
    "trustRisk": 4,
    "score": 88,
    "priority": "High",
    "owner": "CRO + Content",
    "status": "Recommended",
    "sourceUrls": [
      "https://kpattorney.com/contact-us/",
      "https://kpattorney.com/"
    ],
    "seed": true
  },
  {
    "id": "seed-kp-010",
    "clientKey": "kp",
    "client": "Kanner & Pintaluga",
    "platform": "Google Maps / Local",
    "stage": "Compare",
    "moment": "Local pack choice",
    "query": "best injury lawyer near me, hurricane lawyer near me",
    "evidence": "Local ranking depends on relevance, distance and prominence, and local pages should reinforce GBP facts.",
    "currentState": "K&P’s broad footprint requires local pages, reviews and profiles to align by office and practice.",
    "gap": "A national footprint can dilute local relevance if not matched to city/state intent.",
    "recommendation": "Create local service matrix: city × practice × proof × attorney × review themes × GBP.",
    "kpi": "Local pack visibility, GBP actions, local leads",
    "demand": 5,
    "intent": 5,
    "gapScore": 5,
    "feasibility": 3,
    "trustRisk": 5,
    "score": 92,
    "priority": "High",
    "owner": "Local SEO",
    "status": "High Priority",
    "sourceUrls": [
      "https://kpattorney.com/offices/florida/",
      "https://developers.google.com/search/docs/appearance/structured-data/local-business"
    ],
    "seed": true
  },
  {
    "id": "seed-kp-011",
    "clientKey": "kp",
    "client": "Kanner & Pintaluga",
    "platform": "Content",
    "stage": "Ask",
    "moment": "Property claim search",
    "query": "hurricane damage claim denied, roof damage insurance underpaid, water damage attorney",
    "evidence": "Property damage attorney bios and homepage support hurricane, roof, water and storm damage services.",
    "currentState": "Search demand is often issue-specific and time-sensitive after storms or denials.",
    "gap": "Generic property damage content may fail to match claim-stage intent.",
    "recommendation": "Build claim-stage modules: before filing, underpaid, denied, reopened/supplemental, bad faith, evidence checklist, legal review.",
    "kpi": "Property damage leads, nonbrand rankings, page engagement",
    "demand": 5,
    "intent": 5,
    "gapScore": 4,
    "feasibility": 3,
    "trustRisk": 5,
    "score": 87,
    "priority": "High",
    "owner": "SEO + Legal",
    "status": "Recommended",
    "sourceUrls": [
      "https://kpattorney.com/",
      "https://kpattorney.com/firm/attorneys/richard-g-leonardis/",
      "https://www.williamspa.com/practice-areas/insurance-claims/hurricane-damage/"
    ],
    "seed": true
  },
  {
    "id": "seed-kp-012",
    "clientKey": "kp",
    "client": "Kanner & Pintaluga",
    "platform": "AI Answers",
    "stage": "Compare",
    "moment": "Decision answer tests",
    "query": "Should I hire a public adjuster or lawyer? What if insurance denied my claim?",
    "evidence": "Third-party legal content shows users compare public adjusters and lawyers based on claim stage and denial status.",
    "currentState": "K&P needs careful legally reviewed content that answers decision questions without overpromising.",
    "gap": "AI answers may cite competitors or generic legal sites if K&P lacks specific guidance.",
    "recommendation": "Create legally reviewed decision guides with state disclaimers and intake CTA for denied/underpaid claims.",
    "kpi": "AI prompt inclusion, organic leads, assisted conversions",
    "demand": 4,
    "intent": 5,
    "gapScore": 5,
    "feasibility": 3,
    "trustRisk": 5,
    "score": 88,
    "priority": "High",
    "owner": "SEO + Legal",
    "status": "Recommended",
    "sourceUrls": [
      "https://theclaimdefenders.com/public-adjuster-vs-lawyer-for-insurance/",
      "https://kpattorney.com/contact-us/"
    ],
    "seed": true
  },
  {
    "id": "seed-kp-013",
    "clientKey": "kp",
    "client": "Kanner & Pintaluga",
    "platform": "Technical SEO",
    "stage": "Ask",
    "moment": "Crawl and render",
    "query": "Can Googlebot and AI systems access legal facts?",
    "evidence": "Google requires accessible 200 pages with indexable content and renders JavaScript to understand pages.",
    "currentState": "K&P should verify important location/practice/bio pages render stable text, schema and canonical URLs.",
    "gap": "Technical blockers can hide attorney facts and local content from search and AI systems.",
    "recommendation": "Run priority crawl: robots, status, canonical, rendered text, schema, H1, internal links, indexability.",
    "kpi": "Indexability pass rate, schema warnings, crawl errors",
    "demand": 5,
    "intent": 5,
    "gapScore": 4,
    "feasibility": 4,
    "trustRisk": 5,
    "score": 91,
    "priority": "High",
    "owner": "Technical SEO",
    "status": "Needs Validation",
    "sourceUrls": [
      "https://developers.google.com/search/docs/essentials/technical",
      "https://developers.google.com/search/docs/fundamentals/how-search-works"
    ],
    "seed": true
  },
  {
    "id": "seed-kp-014",
    "clientKey": "kp",
    "client": "Kanner & Pintaluga",
    "platform": "Structured Data",
    "stage": "Validate",
    "moment": "Legal entity markup",
    "query": "LegalService schema, Attorney schema, Organization schema, local business schema",
    "evidence": "Google Organization and LocalBusiness documentation supports entity and location details.",
    "currentState": "Legal multi-office sites need a parent entity plus local office/service structure.",
    "gap": "Flat or inconsistent schema can create entity confusion across offices and practice areas.",
    "recommendation": "Implement parent Organization, office LocalBusiness/LegalService, Attorney/Person bios, Breadcrumb, Article where appropriate.",
    "kpi": "Rich results validation, entity consistency, local visibility",
    "demand": 4,
    "intent": 5,
    "gapScore": 5,
    "feasibility": 3,
    "trustRisk": 5,
    "score": 88,
    "priority": "High",
    "owner": "Technical SEO",
    "status": "High Priority",
    "sourceUrls": [
      "https://developers.google.com/search/docs/appearance/structured-data/organization",
      "https://developers.google.com/search/docs/appearance/structured-data/local-business",
      "https://kpattorney.com/offices/florida/"
    ],
    "seed": true
  },
  {
    "id": "seed-kp-015",
    "clientKey": "kp",
    "client": "Kanner & Pintaluga",
    "platform": "Content / E-E-A-T",
    "stage": "Validate",
    "moment": "Case results proof",
    "query": "settlements, no fees unless we win, results depend on case",
    "evidence": "Homepage includes recent settlements and proof but legal outcomes need careful context and disclaimers.",
    "currentState": "Case results can build trust but also introduce compliance risk if not framed correctly.",
    "gap": "Each proof point should connect to case type/state/attorney involvement and disclaimers.",
    "recommendation": "Create proof module standard: result, case type, state, context, disclaimer, next-step CTA.",
    "kpi": "Proof engagement, legal review pass, lead conversion",
    "demand": 4,
    "intent": 5,
    "gapScore": 4,
    "feasibility": 3,
    "trustRisk": 5,
    "score": 83,
    "priority": "High",
    "owner": "SEO + Legal",
    "status": "Recommended",
    "sourceUrls": [
      "https://kpattorney.com/",
      "https://kpattorney.com/personal-injury/premises-liability/"
    ],
    "seed": true
  },
  {
    "id": "seed-kp-016",
    "clientKey": "kp",
    "client": "Kanner & Pintaluga",
    "platform": "YouTube / Video",
    "stage": "Validate",
    "moment": "Explainer search",
    "query": "what happens after car accident, denied roof claim, when to call lawyer",
    "evidence": "Urgent legal users need explanation, not just text.",
    "currentState": "Public site has intake and process copy; video could humanize and clarify high-stress decisions.",
    "gap": "Without video proof, users may rely on competitor explainers or forum answers.",
    "recommendation": "Create attorney-led short explainers tied to practice pages and transcripts: 60-90 seconds each.",
    "kpi": "Video views from search, assisted leads, page engagement",
    "demand": 4,
    "intent": 4,
    "gapScore": 4,
    "feasibility": 3,
    "trustRisk": 4,
    "score": 76,
    "priority": "Medium",
    "owner": "Content + Legal",
    "status": "Recommended",
    "sourceUrls": [
      "https://kpattorney.com/contact-us/",
      "https://kpattorney.com/firm/attorneys/richard-g-leonardis/"
    ],
    "seed": true
  },
  {
    "id": "seed-kp-017",
    "clientKey": "kp",
    "client": "Kanner & Pintaluga",
    "platform": "On-site Search / UX",
    "stage": "Act",
    "moment": "Form confidence",
    "query": "is consultation free, upload file, what details to include",
    "evidence": "Contact form supports service type, case details and file upload.",
    "currentState": "Forms can feel high-friction without context around privacy, what to upload, and response time.",
    "gap": "High-stress users need reassurance before submitting sensitive details.",
    "recommendation": "Add microcopy: response expectation, file types, privacy reassurance, no-obligation language, emergency call path.",
    "kpi": "Form completion, field abandonment, call switch rate",
    "demand": 5,
    "intent": 5,
    "gapScore": 4,
    "feasibility": 4,
    "trustRisk": 5,
    "score": 91,
    "priority": "High",
    "owner": "CRO",
    "status": "Recommended",
    "sourceUrls": [
      "https://kpattorney.com/contact-us/"
    ],
    "seed": true
  },
  {
    "id": "seed-kp-018",
    "clientKey": "kp",
    "client": "Kanner & Pintaluga",
    "platform": "Content Architecture",
    "stage": "Ask",
    "moment": "State and city footprint",
    "query": "Florida lawyer, Texas accident lawyer, New York injury lawyer",
    "evidence": "Offices page lists many states; homepage contains Texas hero; firm roots are Florida/Boca.",
    "currentState": "Search and AI need clean hierarchy: national, state, city, office, practice, attorney.",
    "gap": "Footprint growth creates duplicate or thin location content if not governed.",
    "recommendation": "Map state/city/practice architecture and enforce canonical templates with unique local proof.",
    "kpi": "Location rankings, indexed local pages, lead quality",
    "demand": 5,
    "intent": 5,
    "gapScore": 5,
    "feasibility": 3,
    "trustRisk": 5,
    "score": 92,
    "priority": "High",
    "owner": "SEO Architecture",
    "status": "High Priority",
    "sourceUrls": [
      "https://kpattorney.com/offices/",
      "https://kpattorney.com/",
      "https://kpattorney.com/offices/florida/"
    ],
    "seed": true
  },
  {
    "id": "seed-kp-019",
    "clientKey": "kp",
    "client": "Kanner & Pintaluga",
    "platform": "Spanish Search",
    "stage": "Validate",
    "moment": "Spanish local proof",
    "query": "abogado en Boca Raton, abogado de huracanes, abogado de accidentes cerca de mi",
    "evidence": "Spanish location snippets contain literal/awkward translations of city names in some examples.",
    "currentState": "This undermines professional trust and local relevance.",
    "gap": "Spanish legal pages need native-quality localization and place-name protection rules.",
    "recommendation": "Create Spanish QA glossary for office names, practice names, CTAs, legal terms, schema, hreflang, and forms.",
    "kpi": "Spanish leads, QA pass rate, Spanish CTR",
    "demand": 4,
    "intent": 5,
    "gapScore": 5,
    "feasibility": 3,
    "trustRisk": 5,
    "score": 88,
    "priority": "High",
    "owner": "SEO + Translation",
    "status": "High Priority",
    "sourceUrls": [
      "https://kpattorney.com/es/",
      "https://kpattorney.com/offices/florida/"
    ],
    "seed": true
  },
  {
    "id": "seed-kp-020",
    "clientKey": "kp",
    "client": "Kanner & Pintaluga",
    "platform": "Reviews / Reputation",
    "stage": "Learn / Share",
    "moment": "Post-case advocacy",
    "query": "leave review, refer a lawyer, case manager review",
    "evidence": "Homepage testimonials mention staff/case manager experience, not just attorney outcome.",
    "currentState": "This is powerful because legal trust often forms around communication quality.",
    "gap": "Testimonials should be thematically organized and connected to service lines/locations.",
    "recommendation": "Tag and publish review themes: communication, speed, case manager, settlement, Spanish, property damage, injury.",
    "kpi": "Review theme coverage, on-page engagement, local conversion",
    "demand": 4,
    "intent": 4,
    "gapScore": 4,
    "feasibility": 4,
    "trustRisk": 4,
    "score": 80,
    "priority": "Medium",
    "owner": "Reputation + Content",
    "status": "Recommended",
    "sourceUrls": [
      "https://kpattorney.com/"
    ],
    "seed": true
  },
  {
    "id": "seed-kp-021",
    "clientKey": "kp",
    "client": "Kanner & Pintaluga",
    "platform": "Reddit / Forums",
    "stage": "Validate",
    "moment": "Fee anxiety",
    "query": "does personal injury lawyer cost upfront, contingency fee, free consultation",
    "evidence": "K&P’s contact page explains no appointment fees, no retainers, and no recovery/no pay. A separate Reddit legal discussion also includes explicit reminders that forum comments are not a substitute for advice from an attorney, reinforcing the need to distinguish general education from case-specific guidance.",
    "currentState": "Cost reassurance exists, but it should appear earlier in the journey alongside a clear boundary between general information and legal advice.",
    "gap": "If cost and consultation expectations are buried, users may abandon the journey or rely on incomplete forum guidance.",
    "recommendation": "Add legally approved cost-reassurance and information-boundary modules to relevant practice and location pages, then link to the consultation path.",
    "kpi": "Form starts, call clicks, FAQ engagement",
    "demand": 5,
    "intent": 5,
    "gapScore": 3,
    "feasibility": 5,
    "trustRisk": 5,
    "score": 90,
    "priority": "High",
    "owner": "Content + Legal",
    "status": "Recommended",
    "sourceUrls": [
      "https://kpattorney.com/contact-us/",
      "https://ca.reddit.com/r/bayarea/comments/1gvies6/main_tenant_died_san_francisco/"
    ],
    "seed": true
  },
  {
    "id": "seed-kp-022",
    "clientKey": "kp",
    "client": "Kanner & Pintaluga",
    "platform": "AI Answers",
    "stage": "Validate",
    "moment": "Cited-source readiness",
    "query": "best lawyer for roof damage claim in Florida, Kanner Pintaluga property damage lawyers",
    "evidence": "AI answer engines need entity clarity, location proof, attorney proof, reviews and claim-stage pages.",
    "currentState": "K&P has many proof assets but may not have a single machine-readable fact layer.",
    "gap": "Without a source-of-truth layer, AI tools can choose old news or thin office pages.",
    "recommendation": "Create AI source pages by practice/state with canonical facts, bios, outcomes, FAQs, and source links.",
    "kpi": "Prompt citation rate, fact accuracy, GSC AI impressions where available",
    "demand": 4,
    "intent": 5,
    "gapScore": 5,
    "feasibility": 3,
    "trustRisk": 5,
    "score": 88,
    "priority": "High",
    "owner": "SEO Strategy",
    "status": "High Priority",
    "sourceUrls": [
      "https://developers.google.com/search/blog/2026/06/gen-ai-performance-reports",
      "https://kpattorney.com/",
      "https://kpattorney.com/firm/attorneys/richard-g-leonardis/"
    ],
    "seed": true
  },
  {
    "id": "seed-kp-023",
    "clientKey": "kp",
    "client": "Kanner & Pintaluga",
    "platform": "Google Search",
    "stage": "Scan",
    "moment": "Blog recency and topical authority",
    "query": "pain and suffering, pedestrian accident, motorcycle bias",
    "evidence": "Homepage latest news shows legal blog topics tied to personal injury.",
    "currentState": "Blog program exists, but Search Everywhere strategy should connect posts to practice/location/action pages.",
    "gap": "Educational posts should not dead-end without intake path and proof.",
    "recommendation": "Add content-to-action linking system: each blog links to relevant practice page, office page, attorney proof and consultation CTA.",
    "kpi": "Blog assisted leads, internal CTR, rankings",
    "demand": 4,
    "intent": 4,
    "gapScore": 3,
    "feasibility": 5,
    "trustRisk": 3,
    "score": 77,
    "priority": "Medium",
    "owner": "Content SEO",
    "status": "Recommended",
    "sourceUrls": [
      "https://kpattorney.com/",
      "https://kpattorney.com/personal-injury/premises-liability/"
    ],
    "seed": true
  },
  {
    "id": "seed-kp-024",
    "clientKey": "kp",
    "client": "Kanner & Pintaluga",
    "platform": "Local SEO",
    "stage": "Compare",
    "moment": "Office type clarity",
    "query": "appointment only attorney office, satellite office, nearby lawyer",
    "evidence": "Florida locations include appointment-only and satellite labels.",
    "currentState": "Those labels are useful if consistent across location pages, schema and GBP.",
    "gap": "Users may visit/call wrong office if expectations are not clear.",
    "recommendation": "Standardize office type taxonomy: full office, appointment-only, satellite, partner firm; show visible expectations and schema.",
    "kpi": "Direction quality, call quality, support reduction",
    "demand": 4,
    "intent": 5,
    "gapScore": 4,
    "feasibility": 4,
    "trustRisk": 5,
    "score": 87,
    "priority": "High",
    "owner": "Local SEO + CX",
    "status": "High Priority",
    "sourceUrls": [
      "https://kpattorney.com/offices/florida/"
    ],
    "seed": true
  },
  {
    "id": "seed-kp-025",
    "clientKey": "kp",
    "client": "Kanner & Pintaluga",
    "platform": "Structured Data",
    "stage": "Validate",
    "moment": "SameAs and identity",
    "query": "official profiles, attorney profiles, local listings",
    "evidence": "Organization schema can include online presence and real-world presence such as URL, logo, address, telephone.",
    "currentState": "Multi-state legal brands benefit from sameAs profile control and consistent naming.",
    "gap": "Unlinked or conflicting profiles increase entity ambiguity.",
    "recommendation": "Create sameAs registry for parent firm, offices, social profiles, legal directories, attorney profiles.",
    "kpi": "Entity consistency, Knowledge Panel accuracy, branded SERP control",
    "demand": 4,
    "intent": 4,
    "gapScore": 4,
    "feasibility": 3,
    "trustRisk": 4,
    "score": 76,
    "priority": "Medium",
    "owner": "Technical SEO",
    "status": "Recommended",
    "sourceUrls": [
      "https://developers.google.com/search/docs/appearance/structured-data/organization",
      "https://kpattorney.com/firm/"
    ],
    "seed": true
  },
  {
    "id": "seed-kp-026",
    "clientKey": "kp",
    "client": "Kanner & Pintaluga",
    "platform": "Voice / Assistant",
    "stage": "Act",
    "moment": "Emergency search",
    "query": "call accident lawyer near me, lawyer open now, attorney hotline",
    "evidence": "K&P prominently states 24/7 phone support.",
    "currentState": "Voice/local actions depend on correct phone, hours and local profile consistency.",
    "gap": "If local hours/phone mismatch, urgent callers may route elsewhere.",
    "recommendation": "Audit click-to-call, schema telephone, GBP phone, after-hours call handling, and UTM/call tracking.",
    "kpi": "Calls from local, after-hours leads, phone data consistency",
    "demand": 5,
    "intent": 5,
    "gapScore": 4,
    "feasibility": 3,
    "trustRisk": 5,
    "score": 87,
    "priority": "High",
    "owner": "Local SEO + Analytics",
    "status": "Recommended",
    "sourceUrls": [
      "https://kpattorney.com/contact-us/",
      "https://kpattorney.com/",
      "https://developers.google.com/search/docs/appearance/structured-data/local-business"
    ],
    "seed": true
  },
  {
    "id": "seed-kp-027",
    "clientKey": "kp",
    "client": "Kanner & Pintaluga",
    "platform": "Competitor SERP",
    "stage": "Compare",
    "moment": "Property damage competition",
    "query": "hurricane claim lawyer Florida, roof damage insurance lawyer",
    "evidence": "Competitor/topic pages frame denial, underpayment, supplemental claims and evidence workflows.",
    "currentState": "K&P has property damage credentials but needs query-specific guidance pages that match claim stage.",
    "gap": "Searchers compare claim-stage specificity before choosing a firm.",
    "recommendation": "Create property damage cluster map: damage type, insurer response, city/state, evidence, deadline, attorney proof.",
    "kpi": "Nonbrand rankings, leads by damage type, assisted calls",
    "demand": 5,
    "intent": 5,
    "gapScore": 5,
    "feasibility": 3,
    "trustRisk": 5,
    "score": 92,
    "priority": "High",
    "owner": "SEO + Legal",
    "status": "Recommended",
    "sourceUrls": [
      "https://www.williamspa.com/practice-areas/insurance-claims/hurricane-damage/",
      "https://kpattorney.com/firm/attorneys/richard-g-leonardis/"
    ],
    "seed": true
  },
  {
    "id": "seed-kp-028",
    "clientKey": "kp",
    "client": "Kanner & Pintaluga",
    "platform": "Measurement",
    "stage": "Learn / Share",
    "moment": "Lead source truth",
    "query": "Which search surface drove the case?",
    "evidence": "Search Everywhere spans Google, Maps, reviews, Reddit, AI, video, directories and site actions.",
    "currentState": "Lead forms may not capture platform influence before conversion.",
    "gap": "Without source layering, strategy decisions will over-credit last click.",
    "recommendation": "Add lead-source taxonomy: measured referral, local action, prompt test, review exposure, VOC theme, assisted page path.",
    "kpi": "Attribution coverage, lead quality by source, monthly insights",
    "demand": 5,
    "intent": 5,
    "gapScore": 4,
    "feasibility": 4,
    "trustRisk": 4,
    "score": 89,
    "priority": "High",
    "owner": "Analytics",
    "status": "Recommended",
    "sourceUrls": [
      "https://developers.google.com/search/blog/2026/06/gen-ai-performance-reports",
      "https://support.reddithelp.com/hc/en-us/articles/32026729424916-Reddit-s-AI-search",
      "https://kpattorney.com/contact-us/"
    ],
    "seed": true
  },
  {
    "id": "seed-kp-029",
    "clientKey": "kp",
    "client": "Kanner & Pintaluga",
    "platform": "Governance",
    "stage": "Learn / Share",
    "moment": "Legal review workflow",
    "query": "Who approves legal content and offsite recommendations?",
    "evidence": "Search Everywhere legal recommendations touch attorney advertising, testimonials, case results and legal advice boundaries.",
    "currentState": "If governance is weak, strategy can create compliance risk.",
    "gap": "Every recommendation needs approval type and owner.",
    "recommendation": "Add approval columns: SEO, legal, client, dev, reputation; tag high-risk legal copy before publishing.",
    "kpi": "Approval turnaround, compliance pass rate, published actions",
    "demand": 5,
    "intent": 5,
    "gapScore": 5,
    "feasibility": 5,
    "trustRisk": 5,
    "score": 100,
    "priority": "High",
    "owner": "SEO Lead + Legal",
    "status": "High Priority",
    "sourceUrls": [
      "https://kpattorney.com/",
      "https://developers.google.com/search/updates"
    ],
    "seed": true
  },
  {
    "id": "seed-kp-030",
    "clientKey": "kp",
    "client": "Kanner & Pintaluga",
    "platform": "Content / E-E-A-T",
    "stage": "Validate",
    "moment": "First-party property damage depth",
    "query": "property owners, hurricane, fire, water, mold claims",
    "evidence": "Property damage bios show deep first-party insurance experience and defense-side insight.",
    "currentState": "These expert facts should be reused to prove specialization on money pages.",
    "gap": "Generic firm copy underuses high-value attorney-specific proof.",
    "recommendation": "Add expert proof rails: attorney quotes, experience bullets, admissions, claim-type specialization, reviewed-by tags if true.",
    "kpi": "Practice page conversion, bio clicks, AI citation accuracy",
    "demand": 5,
    "intent": 5,
    "gapScore": 4,
    "feasibility": 4,
    "trustRisk": 5,
    "score": 91,
    "priority": "High",
    "owner": "Content + Legal",
    "status": "Recommended",
    "sourceUrls": [
      "https://kpattorney.com/firm/attorneys/richard-g-leonardis/",
      "https://kpattorney.com/firm/"
    ],
    "seed": true
  },
  {
    "id": "seed-kp-031",
    "clientKey": "kp",
    "client": "Kanner & Pintaluga",
    "platform": "Search Everywhere Governance",
    "stage": "Learn / Share",
    "moment": "Team operating model",
    "query": "How does SEO consult beyond Google without doing organic social?",
    "evidence": "K&P needs SEO, local, content, legal, reputation, analytics and dev coordination.",
    "currentState": "Current work spans many teams and approval types.",
    "gap": "Search Everywhere can drift into social execution if scope is not defined.",
    "recommendation": "Position the service as consulting: audits, VOC mining, page briefs, schema/local governance, measurement, not daily community management.",
    "kpi": "Deliverable adoption, scoped recommendations, client alignment",
    "demand": 5,
    "intent": 4,
    "gapScore": 4,
    "feasibility": 5,
    "trustRisk": 5,
    "score": 90,
    "priority": "High",
    "owner": "SEO Strategy",
    "status": "Recommended",
    "sourceUrls": [
      "https://redditinc.com/news/introducing-reddit-answers",
      "https://developers.google.com/search/blog/2026/06/gen-ai-performance-reports"
    ],
    "seed": true
  }
];

export const SOURCES = [
  {
    "id": "GSC_GEN_AI",
    "title": "Google Search Generative AI performance reports",
    "type": "Platform documentation",
    "use": "Supports new AI visibility reporting in Search Console.",
    "url": "https://developers.google.com/search/blog/2026/06/gen-ai-performance-reports"
  },
  {
    "id": "GOOGLE_SEARCH_WORKS",
    "title": "How Google Search works",
    "type": "Platform documentation",
    "use": "Supports crawl, render, index, understand model.",
    "url": "https://developers.google.com/search/docs/fundamentals/how-search-works"
  },
  {
    "id": "GOOGLE_TECH_REQ",
    "title": "Google Search technical requirements",
    "type": "Platform documentation",
    "use": "Supports crawlability and indexability checklist.",
    "url": "https://developers.google.com/search/docs/essentials/technical"
  },
  {
    "id": "GOOGLE_PRODUCT_SD",
    "title": "Google product structured data updates",
    "type": "Platform documentation",
    "use": "Supports product/review/offer structured data requirements and updates.",
    "url": "https://developers.google.com/search/updates"
  },
  {
    "id": "GOOGLE_ORG_SD",
    "title": "Organization structured data",
    "type": "Platform documentation",
    "use": "Supports entity clarity and sameAs/contact/location governance.",
    "url": "https://developers.google.com/search/docs/appearance/structured-data/organization"
  },
  {
    "id": "GOOGLE_LOCAL_SD",
    "title": "Local Business structured data",
    "type": "Platform documentation",
    "use": "Supports location, departments, hours, contact, and local business markup.",
    "url": "https://developers.google.com/search/docs/appearance/structured-data/local-business"
  },
  {
    "id": "REDDIT_AI_SEARCH",
    "title": "Reddit AI search help",
    "type": "Platform documentation",
    "use": "Supports Reddit as an AI-powered answer and community-search surface.",
    "url": "https://support.reddithelp.com/hc/en-us/articles/32026729424916-Reddit-s-AI-search"
  },
  {
    "id": "REDDIT_ANSWERS",
    "title": "Introducing Reddit Answers",
    "type": "Platform documentation",
    "use": "Supports Reddit Answers as a merged/unified search experience.",
    "url": "https://redditinc.com/news/introducing-reddit-answers"
  },
  {
    "id": "TIKTOK_SEARCH_ADS",
    "title": "TikTok automated keywords for Search Ads campaigns",
    "type": "Platform documentation",
    "use": "Supports TikTok as query-led visual search and high-intent search surface.",
    "url": "https://ads.tiktok.com/help/article/about-automated-keywords-for-search-ads-campaigns"
  },
  {
    "id": "BREEZY_HOME",
    "title": "Breezy Golf homepage",
    "type": "Client website",
    "use": "Supports brand positioning, category structure, creator affiliation, and current SEO content.",
    "url": "https://breezygolf.com/"
  },
  {
    "id": "BREEZY_ABOUT",
    "title": "Breezy Golf About Us",
    "type": "Client website",
    "use": "Supports brand, Bob Does Sports, product feature, bundle, sizing, and drop positioning.",
    "url": "https://breezygolf.com/pages/about-us"
  },
  {
    "id": "BREEZY_BLOG",
    "title": "Breezy Blog",
    "type": "Client website",
    "use": "Supports current content program and buyer-guidance topics.",
    "url": "https://breezygolf.com/blogs/breezy-blog"
  },
  {
    "id": "BREEZY_WORTH_IT",
    "title": "Is Breezy Golf Worth It?",
    "type": "Client website",
    "use": "Supports branded validation queries and comparison-ready content.",
    "url": "https://breezygolf.com/blogs/breezy-blog/is-breezy-golf-worth-it"
  },
  {
    "id": "BREEZY_PRODUCT_POLO",
    "title": "Breezy product page example: Throwin' Darts Polo",
    "type": "Client website",
    "use": "Supports PDP feature/review pattern and product copy audit.",
    "url": "https://breezygolf.com/products/the-throwin-darts-polo"
  },
  {
    "id": "BREEZY_HATS",
    "title": "Breezy hats collection",
    "type": "Client website",
    "use": "Supports collection filter, product count, hat subcategory, and category copy audit.",
    "url": "https://breezygolf.com/collections/hats"
  },
  {
    "id": "BREEZY_THIRDPARTY",
    "title": "Third-party Breezy Golf review",
    "type": "Third-party review",
    "use": "Directional outside validation and community/VOC synthesis; not a source of truth for first-party metrics.",
    "url": "https://threeputtgolfclothing.co.uk/blogs/news/breezy-golf-clothing-review"
  },
  {
    "id": "KP_HOME",
    "title": "Kanner & Pintaluga homepage",
    "type": "Client website",
    "use": "Supports current hero, service mix, proof, locations, intake, reviews, and practice areas.",
    "url": "https://kpattorney.com/"
  },
  {
    "id": "KP_CONTACT",
    "title": "Kanner & Pintaluga contact page",
    "type": "Client website",
    "use": "Supports 24/7 intake, free consultation, no upfront cost, contingency, and digital sign-up journey.",
    "url": "https://kpattorney.com/contact-us/"
  },
  {
    "id": "KP_FIRM",
    "title": "Kanner & Pintaluga firm page",
    "type": "Client website",
    "use": "Supports firm facts, nearly 100 attorneys, national footprint, founding year.",
    "url": "https://kpattorney.com/firm/"
  },
  {
    "id": "KP_FLORIDA_LOCATIONS",
    "title": "Kanner & Pintaluga Florida locations",
    "type": "Client website",
    "use": "Supports NAP/location coverage, appointment/satellite issues, and local SEO governance.",
    "url": "https://kpattorney.com/offices/florida/"
  },
  {
    "id": "KP_OFFICES",
    "title": "Kanner & Pintaluga offices",
    "type": "Client website",
    "use": "Supports state footprint and location-architecture audit.",
    "url": "https://kpattorney.com/offices/"
  },
  {
    "id": "KP_SPANISH",
    "title": "Kanner & Pintaluga Spanish pages",
    "type": "Client website",
    "use": "Supports Spanish-language entity, translation, and local-intent opportunities.",
    "url": "https://kpattorney.com/es/"
  },
  {
    "id": "KP_ATTORNEY_PD",
    "title": "Kanner & Pintaluga property damage attorney bio example",
    "type": "Client website",
    "use": "Supports attorney proof, practice specificity, admissions, and schema opportunities.",
    "url": "https://kpattorney.com/firm/attorneys/richard-g-leonardis/"
  },
  {
    "id": "KP_PREMISES",
    "title": "Kanner & Pintaluga premises liability page",
    "type": "Client website",
    "use": "Supports practice page structure, no-fee language, and user journey steps.",
    "url": "https://kpattorney.com/personal-injury/premises-liability/"
  },
  {
    "id": "KP_HOUSTON",
    "title": "Kanner & Pintaluga Houston expansion news",
    "type": "Client website",
    "use": "Supports footprint/proof and potential consistency checks against current state claims.",
    "url": "https://kpattorney.com/news/kanner-pintaluga-expands-presence-in-texas-opens-8000-sq-ft-office-in-houston-to-support-growing-client-demand/"
  },
  {
    "id": "CLAIM_DEFENDERS",
    "title": "Public adjuster vs lawyer for insurance claim",
    "type": "Third-party topic research",
    "use": "Directional VOC/topic evidence for insurance-claim search journeys; verify legally before client copy.",
    "url": "https://theclaimdefenders.com/public-adjuster-vs-lawyer-for-insurance/"
  },
  {
    "id": "WILLIAMS_HURRICANE",
    "title": "Florida hurricane claim lawyer page example",
    "type": "Competitor/topic example",
    "use": "Directional competitor framing for hurricane denial/underpayment query patterns.",
    "url": "https://www.williamspa.com/practice-areas/insurance-claims/hurricane-damage/"
  },
  {
    "id": "REDDIT_ECOM_TRUST",
    "title": "Reddit ecommerce trust discussion: why stores can look untrustworthy",
    "type": "Community discussion, directional only",
    "use": "Category-level VOC on ecommerce trust signals such as design quality, reviews, contact information, policies, imagery, and mobile experience. Not Breezy-specific sentiment.",
    "url": "https://hr.reddit.com/r/dropshipping/comments/1t63i3q/why_your_shopify_store_looks_scammy_in_2026_even/"
  },
  {
    "id": "REDDIT_SHOPIFY_FEEDBACK",
    "title": "Reddit Shopify feedback: recurring store UX and trust gaps",
    "type": "Community discussion, directional only",
    "use": "Category-level VOC on hero clarity, testimonials, navigation, media quality, and trust information. Not evidence that Breezy has every issue.",
    "url": "https://es.reddit.com/r/shopify_hustlers/comments/1plrh4s/common_shopify_mistakes_i_keep_seeing_in_live/"
  },
  {
    "id": "REDDIT_AUTO_FAULT",
    "title": "Reddit discussion: disputed auto-accident fault",
    "type": "Community discussion, directional only",
    "use": "Directional claimant language around evidence, insurer disputes, fault, documentation, and escalation. Not K&P-specific sentiment or legal advice.",
    "url": "https://ja.reddit.com/r/Wellthatsucks/comments/1puotlo/someone_switched_lanes_and_hit_my_car_their/"
  },
  {
    "id": "REDDIT_RENTERS_CLAIM",
    "title": "Reddit discussion: renters-insurance claim frustration",
    "type": "Community discussion, directional only",
    "use": "Directional claimant language around documentation, inspections, temporary housing, damaged property, and coverage uncertainty. Not K&P-specific sentiment or legal advice.",
    "url": "https://vi.reddit.com/r/boston/comments/1itconh/beware_of_lemonade_renters_insurance/"
  },
  {
    "id": "REDDIT_LEGAL_CAUTION",
    "title": "Reddit legal discussion: community guidance is not legal advice",
    "type": "Community discussion, directional only",
    "use": "Supports the workshop distinction between peer discussion, general legal education, and case-specific advice from an attorney.",
    "url": "https://ca.reddit.com/r/bayarea/comments/1gvies6/main_tenant_died_san_francisco/"
  }
];
