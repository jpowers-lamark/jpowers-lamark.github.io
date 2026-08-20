window.SE_CONTENT = Object.freeze({
  version: '2.0.0',
  stages: [
    { key: 'lobby', eyebrow: 'WELCOME', title: 'The Search Fracture', short: 'Start together', minutes: 8 },
    { key: 'psychology', eyebrow: 'ACT I', title: 'How People Search', short: 'Search psychology', minutes: 12 },
    { key: 'journey', eyebrow: 'ACT II', title: 'The Five-Phase Journey', short: 'Learn the journey', minutes: 18 },
    { key: 'surfaces', eyebrow: 'ACT III', title: 'Choose the Right Surface', short: 'Match the moment', minutes: 12 },
    { key: 'wheel', eyebrow: 'LIVE GAME', title: 'The Search Everywhere Wheel', short: 'Spin and teach', minutes: 18 },
    { key: 'tradeoffs', eyebrow: 'ACT IV', title: 'Resource Tradeoffs', short: 'Spend 100 credits', minutes: 15 },
    { key: 'missions', eyebrow: 'ACT V', title: 'Client Micro-Missions', short: 'Apply the model', minutes: 16 },
    { key: 'signals', eyebrow: 'ACT VI', title: 'Human, Machine, Business', short: 'Connect the system', minutes: 12 },
    { key: 'roadmap', eyebrow: 'ACT VII', title: 'The Shared Roadmap Wall', short: 'Make one move', minutes: 18 },
    { key: 'teachback', eyebrow: 'FINAL ROUND', title: 'Client Challenge', short: 'Explain it clearly', minutes: 12 },
    { key: 'debrief', eyebrow: 'CLOSE', title: 'Make It Operational', short: 'Commit and export', minutes: 9 }
  ],
  openingPoll: {
    question: 'Where do you personally search first when you need an honest recommendation?',
    options: [
      { id: 'google', label: 'Google Search', icon: 'G' },
      { id: 'ai', label: 'AI assistant', icon: 'AI' },
      { id: 'reddit', label: 'Reddit or a forum', icon: 'R' },
      { id: 'youtube', label: 'YouTube', icon: '▶' },
      { id: 'social', label: 'TikTok or Instagram', icon: '◎' },
      { id: 'maps', label: 'Maps or reviews', icon: '⌖' }
    ]
  },
  psychologySteps: [
    {
      id: 'gap', number: '01', label: 'Notice a gap', plain: 'Something is unknown, risky, inconvenient, or newly interesting.',
      inner: '“I need to figure this out.”', seo: 'Identify the real uncertainty behind the keyword or prompt.',
      breezy: 'A golfer needs a hat that looks premium and fits well.',
      kp: 'A homeowner realizes an insurer may have underpaid a claim.'
    },
    {
      id: 'orient', number: '02', label: 'Choose a starting point', plain: 'The person picks the surface that feels fastest or most trustworthy for this question.',
      inner: '“Where am I most likely to get a useful answer?”', seo: 'Do not assume Google is always the first or only surface.',
      breezy: 'Instagram may create interest, Google may frame options, Reddit may validate fit.',
      kp: 'Google or an AI assistant may explain the issue, Maps may surface nearby firms.'
    },
    {
      id: 'scan', number: '03', label: 'Scan for cues', plain: 'The person quickly looks for recognizable options, proof, clarity, and warning signs.',
      inner: '“Does any of this look relevant to me?”', seo: 'Make the brand understandable in seconds across every result type.',
      breezy: 'Product imagery, style, price, fit details, and recognizable reviews matter.',
      kp: 'Practice-area clarity, location, credentials, reviews, and a clear next step matter.'
    },
    {
      id: 'judge', number: '04', label: 'Reduce uncertainty', plain: 'The person compares sources and looks for independent confirmation.',
      inner: '“Can I trust this enough to keep going?”', seo: 'Connect owned claims with offsite proof, citations, reviews, and community language.',
      breezy: 'The shopper checks reviews, creator demonstrations, Reddit, and tagged posts.',
      kp: 'The claimant checks attorney profiles, reviews, case experience, directories, and educational answers.'
    },
    {
      id: 'reformulate', number: '05', label: 'Refine the question', plain: 'New information changes the next query, platform, or standard of proof.',
      inner: '“Now I need to know something more specific.”', seo: 'Map follow-up questions, comparisons, objections, and next-step searches.',
      breezy: '“Breezy hat sizing,” “Breezy Golf reviews,” or a direct product comparison.',
      kp: '“How long do I have to dispute a claim?” or “property insurance attorney near me.”'
    },
    {
      id: 'decide', number: '06', label: 'Act, return, or advocate', plain: 'The person buys, contacts, delays, returns later, or tells someone else.',
      inner: '“I am ready, or I still need more proof.”', seo: 'Measure the decision and the searches that continue after it.',
      breezy: 'Purchase, return visit, branded search, review, or recommendation.',
      kp: 'Call, form submission, document gathering, later research, or referral.'
    }
  ],
  psychologyQuiz: [
    { id: 'pq1', prompt: 'A shopper sees a golf hat on Instagram, then searches “Breezy Golf reviews.” What changed?', options: ['They entered comparison and validation', 'They completed the purchase', 'They stopped searching', 'They entered local search'], answer: 0, explain: 'The social exposure created interest, but the branded review query is an attempt to reduce uncertainty.' },
    { id: 'pq2', prompt: 'A homeowner asks an AI assistant what an underpaid insurance claim means, then searches Maps for an attorney. Why switch surfaces?', options: ['AI failed technically', 'The user moved from understanding to finding a local option', 'Maps always ranks higher', 'The user forgot the first answer'], answer: 1, explain: 'The information need changed. A general explanation became a local action need.' },
    { id: 'pq3', prompt: 'A user repeats the same question with more detail after reading a result. This is:', options: ['Advocacy', 'Reformulation', 'Conversion', 'Brand demand'], answer: 1, explain: 'Search is iterative. Each answer can create a more specific next question.' },
    { id: 'pq4', prompt: 'Which behavior most clearly signals validation?', options: ['Opening the first result', 'Comparing reviews and independent discussions', 'Seeing an ad', 'Typing a one-word category'], answer: 1, explain: 'Validation is the attempt to determine whether a claim or option is trustworthy.' }
  ],
  journeyPhases: [
    {
      id: 'spark', number: '01', title: 'Spark', subtitle: 'A need or interest appears',
      definition: 'The journey begins when something changes. The person notices a problem, desire, deadline, recommendation, or risk.',
      question: 'What happened, and why does it matter now?',
      surfaces: ['Social feeds', 'Word of mouth', 'Email', 'News', 'Offline experience', 'AI suggestions'],
      seoJob: 'Understand the initiating situation and the language the audience uses before it becomes a conventional keyword.',
      breezy: 'A golfer sees a new style before a trip or decides current apparel feels outdated.',
      kp: 'A claim is denied, delayed, or paid below the amount the property owner expected.',
      mistake: 'Starting with a keyword list before understanding what created demand.'
    },
    {
      id: 'search', number: '02', title: 'Search', subtitle: 'The person frames the need',
      definition: 'The person tries to name the problem, understand options, and decide where to look first.',
      question: 'What is this, what are my options, and where should I start?',
      surfaces: ['Google', 'AI assistants', 'YouTube', 'TikTok', 'Reddit', 'Marketplaces'],
      seoJob: 'Create clear answers and choose surfaces based on the user’s task, not the team’s channel ownership.',
      breezy: '“Best premium golf hats,” “golf hats that fit big heads,” or visual style searches.',
      kp: '“Insurance claim underpaid,” “do I need a property damage attorney,” or a conversational AI prompt.',
      mistake: 'Assuming the first search always occurs on Google.'
    },
    {
      id: 'compare', number: '03', title: 'Compare', subtitle: 'Options are narrowed',
      definition: 'The person evaluates differences in fit, cost, quality, expertise, convenience, or risk.',
      question: 'Which option fits my situation best?',
      surfaces: ['Organic results', 'Shopping', 'Product pages', 'Directories', 'YouTube', 'Comparison content'],
      seoJob: 'Make meaningful differences easy to understand and support comparison queries directly.',
      breezy: 'Style, material, fit, shipping, price, and brand alternatives are compared.',
      kp: 'Practice focus, location, credentials, process, reviews, and perceived responsiveness are compared.',
      mistake: 'Publishing generic “why choose us” copy without answering the real comparison criteria.'
    },
    {
      id: 'prove', number: '04', title: 'Prove', subtitle: 'Trust is tested',
      definition: 'The person looks for independent evidence that the option is credible and the decision is safe enough.',
      question: 'Can I trust the brand, claim, product, or professional?',
      surfaces: ['Reviews', 'Reddit', 'Forums', 'Creator content', 'Maps', 'Third-party citations', 'UGC'],
      seoJob: 'Connect owned information with corroborating offsite proof and resolve recurring objections.',
      breezy: 'Customer photos, fit comments, creator demonstrations, Reddit discussions, and policy clarity matter.',
      kp: 'Recent reviews, attorney entities, directories, educational depth, and consistent local information matter.',
      mistake: 'Treating offsite evidence as unrelated to SEO because another team executes it.'
    },
    {
      id: 'act', number: '05', title: 'Act & Echo', subtitle: 'The decision creates the next search',
      definition: 'The person acts, delays, returns, reviews, recommends, or searches again. The journey becomes a loop.',
      question: 'What do I do now, and what will I need next?',
      surfaces: ['Brand site', 'Maps', 'App', 'Email', 'Support', 'Reviews', 'Branded search'],
      seoJob: 'Remove action friction, measure outcomes, and support the searches that happen after conversion.',
      breezy: 'Purchase, order tracking, return questions, later product launches, and advocacy.',
      kp: 'Call, form submission, document preparation, ongoing education, and referral behavior.',
      mistake: 'Ending the search journey at the first conversion.'
    }
  ],
  journeyScenarios: [
    { id: 'js1', text: 'A golfer realizes none of their current hats work with an upcoming event outfit.', phase: 'spark', explain: 'A new need has appeared before the person has selected a search surface.' },
    { id: 'js2', text: 'A homeowner asks ChatGPT what an insurer’s partial denial letter means.', phase: 'search', explain: 'The user is framing and understanding the problem.' },
    { id: 'js3', text: 'A shopper opens Breezy and two competing hat pages side by side.', phase: 'compare', explain: 'The user is evaluating meaningful differences between options.' },
    { id: 'js4', text: 'A claimant reads Google reviews and Reddit discussions before contacting a firm.', phase: 'prove', explain: 'The user is seeking independent evidence and reducing risk.' },
    { id: 'js5', text: 'A customer searches for return instructions and later leaves a product review.', phase: 'act', explain: 'The decision created post-purchase search and advocacy behavior.' },
    { id: 'js6', text: 'A user changes “golf hats” to “premium rope golf hats for large heads.”', phase: 'search', explain: 'The user has refined the need and is performing a more specific search.' },
    { id: 'js7', text: 'A property owner compares three firms by focus, location, reviews, and response process.', phase: 'compare', explain: 'The options are being narrowed based on decision criteria.' },
    { id: 'js8', text: 'A golfer sees a creator wearing a hat and saves the post.', phase: 'spark', explain: 'Discovery created interest, but the purchase journey has not yet been framed.' }
  ],
  surfaces: [
    { id: 'google', name: 'Google Search', role: 'Explicit questions, categories, routes, services, comparisons, and direct demand', strength: 'Captures articulated intent', weak: 'May not provide the peer or visual proof needed to finish the decision', icon: 'G' },
    { id: 'ai', name: 'AI Assistants', role: 'Synthesis, explanation, planning, follow-up questions, and decision support', strength: 'Reduces complexity quickly', weak: 'Answers depend on available and corroborated information', icon: 'AI' },
    { id: 'maps', name: 'Maps & Local', role: 'Nearby options, hours, directions, calls, reviews, and immediate action', strength: 'Combines local relevance and action', weak: 'Distributed listings and inconsistent data can erode trust', icon: '⌖' },
    { id: 'youtube', name: 'YouTube', role: 'Demonstrations, walkthroughs, long-form proof, education, and reviews', strength: 'Shows what an experience or product is actually like', weak: 'Generic brand videos rarely match search intent', icon: '▶' },
    { id: 'social', name: 'TikTok & Instagram', role: 'Visual discovery, creator-led answers, trends, style, and cultural relevance', strength: 'Creates and shapes demand', weak: 'High reach does not automatically equal qualified intent', icon: '◎' },
    { id: 'reddit', name: 'Reddit & Forums', role: 'Peer validation, objections, comparisons, candid language, and edge cases', strength: 'Surfaces what users do not fully trust on owned pages', weak: 'A thread is qualitative evidence, not a representative survey', icon: 'R' },
    { id: 'reviews', name: 'Reviews & Directories', role: 'Reputation, legitimacy, category fit, recency, and third-party validation', strength: 'Strong influence near the decision', weak: 'Volume without relevance or recency can still feel weak', icon: '★' },
    { id: 'owned', name: 'Owned Website', role: 'Canonical facts, product or service detail, conversion, policy, and first-party proof', strength: 'The brand controls clarity and action', weak: 'Owned claims alone may not resolve trust', icon: '⌂' }
  ],
  surfaceMoments: [
    { id: 'sm1', moment: 'I need the closest attorney who handles this specific type of claim.', best: 'maps', why: 'Local relevance, categories, reviews, calls, and directions are central.' },
    { id: 'sm2', moment: 'I want to see how this golf hat looks and fits on a real person.', best: 'youtube', why: 'Demonstration and visual proof are more useful than text alone.' },
    { id: 'sm3', moment: 'I want an honest view of whether customers think a brand is worth the price.', best: 'reddit', why: 'Peer discussion can reveal objections and decision language.' },
    { id: 'sm4', moment: 'I need a clear explanation of a complicated insurance term and follow-up questions.', best: 'ai', why: 'Conversational synthesis is well suited to iterative understanding.' },
    { id: 'sm5', moment: 'I know the exact product category and want to compare available options.', best: 'google', why: 'Explicit category and comparison demand is well suited to search results.' },
    { id: 'sm6', moment: 'I want proof that a law firm is legitimate and consistently trusted nearby.', best: 'reviews', why: 'Recent local reviews and third-party profiles help validate credibility.' },
    { id: 'sm7', moment: 'I need exact shipping, return, material, and sizing information.', best: 'owned', why: 'The brand website should be the canonical source for product facts and policies.' },
    { id: 'sm8', moment: 'I did not know I wanted a new golf style until I saw someone wearing it.', best: 'social', why: 'Visual social surfaces often create interest before explicit search begins.' }
  ],
  wheelCategories: [
    { id: 'define', label: 'Define It', description: 'Explain a concept in plain language.' },
    { id: 'place', label: 'Place the Moment', description: 'Identify the journey phase or best search surface.' },
    { id: 'connect', label: 'Connect the Signal', description: 'Link user evidence to a machine signal and business outcome.' },
    { id: 'client', label: 'Client Answer', description: 'Respond to a realistic client question.' },
    { id: 'roadmap', label: 'Roadmap Move', description: 'Turn one insight into an easy strategic action.' }
  ],
  wheelQuestions: [
    { id: 'w1', category: 'define', prompt: 'Define Search Everywhere without using the words “social media strategy.”', guide: 'Center the answer on audience behavior, decision moments, visibility, and consulting.' },
    { id: 'w2', category: 'define', prompt: 'What is the difference between a search surface and a marketing channel?', guide: 'A surface is where a user resolves a need. Channel ownership does not determine whether search behavior occurs there.' },
    { id: 'w3', category: 'define', prompt: 'Why is Reddit useful even when Lamark is not posting for the client?', guide: 'It provides qualitative audience language, objections, comparisons, and validation signals that inform strategy.' },
    { id: 'w4', category: 'define', prompt: 'Explain why the user journey is a loop rather than a funnel.', guide: 'Answers create follow-up questions, post-conversion searches, returns, reviews, and advocacy.' },
    { id: 'w5', category: 'place', prompt: 'A user sees a product on TikTok, searches Google, then reads Reddit. Name the role of each surface.', guide: 'TikTok creates interest, Google frames and compares, Reddit validates.' },
    { id: 'w6', category: 'place', prompt: 'A homeowner understands the issue but now needs a nearby attorney. Which phase and surface become more important?', guide: 'The journey moves toward comparison/action, and Maps/local results become important.' },
    { id: 'w7', category: 'place', prompt: 'Where would “Is Breezy Golf worth it?” most likely sit in the journey?', guide: 'Prove/validation, although Google may be the entry surface.' },
    { id: 'w8', category: 'place', prompt: 'Which surface is best for demonstrating how a product fits and why?', guide: 'YouTube or short-form video, because the task requires visual proof.' },
    { id: 'w9', category: 'connect', prompt: 'Connect recent reviews to one user need, one system signal, and one business outcome.', guide: 'Trust need → review prominence/recency → conversion or lead quality.' },
    { id: 'w10', category: 'connect', prompt: 'Connect consistent attorney information across the site, Maps, and directories to a business result.', guide: 'Clear entity and local signals reduce confusion and support qualified contact actions.' },
    { id: 'w11', category: 'connect', prompt: 'Connect customer fit questions on Reddit to an owned-site recommendation.', guide: 'Community language reveals uncertainty, which should inform sizing, imagery, FAQs, and demonstrations.' },
    { id: 'w12', category: 'connect', prompt: 'How can one YouTube video support more than YouTube visibility?', guide: 'It can support Google results, AI understanding, product pages, social edits, and user proof.' },
    { id: 'w13', category: 'client', prompt: 'A client says, “Why should SEO care about TikTok if sales happen on our site?” Respond.', guide: 'TikTok may create or shape demand and influence the searches that later reach the site.' },
    { id: 'w14', category: 'client', prompt: 'A client says, “Isn’t this just adding more channels?” Respond.', guide: 'It is prioritizing decision moments and platform roles, not recommending every platform.' },
    { id: 'w15', category: 'client', prompt: 'A client asks, “How can we measure this if some platforms do not expose keyword data?” Respond.', guide: 'Separate measured performance, directional evidence, and qualitative intelligence.' },
    { id: 'w16', category: 'client', prompt: 'A client asks, “What is Lamark actually responsible for?” Respond.', guide: 'Audience research, audit, strategy, prioritization, owned SEO execution, measurement, and coordination with execution teams.' },
    { id: 'w17', category: 'roadmap', prompt: 'Create one easy Breezy roadmap move that improves the Prove phase.', guide: 'Examples: fit proof hub, review/UGC integration, creator demonstrations, or review-query content.' },
    { id: 'w18', category: 'roadmap', prompt: 'Create one easy KP roadmap move that connects Search and Prove.', guide: 'Examples: plain-language claim guide linked to attorney proof and local action.' },
    { id: 'w19', category: 'roadmap', prompt: 'Turn a recurring Reddit objection into a cross-team recommendation.', guide: 'State the audience uncertainty, owned answer, offsite proof need, execution owner, and KPI.' },
    { id: 'w20', category: 'roadmap', prompt: 'Create one measurement initiative that works across multiple search surfaces.', guide: 'Examples: branded validation query tracking, tagged links, review trends, AI citation monitoring, and assisted conversions.' }
  ],
  tradeoffSignals: [
    { id: 'answers', label: 'Owned Answers', description: 'Pages and content that clearly answer needs, comparisons, policies, and follow-up questions.', examples: 'Route/product/service pages, FAQs, guides, comparisons' },
    { id: 'proof', label: 'Reviews & Proof', description: 'Evidence that reduces risk and supports credibility near the decision.', examples: 'Reviews, testimonials, case proof, customer photos, outcomes' },
    { id: 'community', label: 'Community Intelligence', description: 'Listening to and learning from peer discussion, objections, and recommendation language.', examples: 'Reddit, forums, Q&A communities, niche groups' },
    { id: 'video', label: 'Video & Demonstration', description: 'Visual or explanatory assets that show what an experience, product, or process is like.', examples: 'YouTube, short-form video, walkthroughs, product demos' },
    { id: 'local', label: 'Local Presence', description: 'Accurate and persuasive location information where proximity and immediate action matter.', examples: 'Maps, profiles, categories, reviews, directions, calls' },
    { id: 'entity', label: 'Entity & Citation Consistency', description: 'Consistent facts and relationships that help systems understand the brand and corroborate claims.', examples: 'Profiles, structured data, authorship, directories, mentions' },
    { id: 'experience', label: 'Conversion Experience', description: 'The usability, clarity, and next-step experience after visibility is earned.', examples: 'Product details, contact paths, forms, calls to action, mobile UX' },
    { id: 'measurement', label: 'Measurement & Learning', description: 'The instrumentation needed to distinguish performance, direction, and qualitative evidence.', examples: 'Search Console, tagged links, listening logs, review trends, assisted conversion' }
  ],
  missions: {
    breezy: [
      { id: 'bm1', title: 'Fit uncertainty', scenario: 'A user likes a Breezy hat on Instagram but searches Reddit and Google for sizing before purchasing.', phase: 'prove', surface: 'reddit', insight: 'Visual discovery created demand, but independent fit proof is needed to finish the decision.', choices: ['Publish more generic brand posts', 'Create fit guidance plus customer and creator demonstrations', 'Increase homepage word count'], answer: 1 },
      { id: 'bm2', title: 'Category comparison', scenario: 'A shopper compares Breezy with three golf apparel brands on Google and YouTube.', phase: 'compare', surface: 'google', insight: 'The brand must make meaningful product differences and proof easy to evaluate.', choices: ['Build category comparison and product proof assets', 'Remove competitor language from research', 'Focus only on branded rankings'], answer: 0 },
      { id: 'bm3', title: 'Price validation', scenario: 'A shopper asks an AI assistant whether premium golf hats are worth the price.', phase: 'prove', surface: 'ai', insight: 'Value claims need clear product facts and third-party corroboration.', choices: ['Add unsupported superlatives', 'Strengthen materials, construction, fit, care, reviews, and citations', 'Hide prices until checkout'], answer: 1 },
      { id: 'bm4', title: 'Post-purchase loop', scenario: 'A customer searches for return instructions, then later reviews the product.', phase: 'act', surface: 'owned', insight: 'Support and advocacy are part of the search journey, not separate from it.', choices: ['Treat the sale as the end of SEO', 'Improve post-purchase findability and review capture', 'Remove support pages from search'], answer: 1 },
      { id: 'bm5', title: 'Trend without ownership', scenario: 'A rope-hat style starts trending, but Breezy has no search-led video or category explanation.', phase: 'spark', surface: 'social', insight: 'Demand is forming before traditional keyword reporting fully reflects it.', choices: ['Wait until volume is proven for a year', 'Create a small trend-to-category content test', 'Publish unrelated lifestyle posts'], answer: 1 },
      { id: 'bm6', title: 'Weak product proof', scenario: 'The product page has good imagery but little detail about fit, material, care, or use.', phase: 'compare', surface: 'owned', insight: 'The canonical product source is not answering comparison criteria.', choices: ['Add decision-ready product information', 'Add more homepage banners', 'Rely entirely on social comments'], answer: 0 }
    ],
    kp: [
      { id: 'km1', title: 'Issue explanation', scenario: 'A property owner asks an AI assistant what an underpaid claim means before searching for help.', phase: 'search', surface: 'ai', insight: 'Plain-language education can shape the shortlist before a local firm search begins.', choices: ['Publish clear issue-led guides with attorney and local connections', 'Use only generic practice-area copy', 'Avoid answering legal-process questions'], answer: 0 },
      { id: 'km2', title: 'Local validation', scenario: 'A claimant finds three firms in Maps and compares reviews, distance, and practice focus.', phase: 'compare', surface: 'maps', insight: 'Local profile relevance and proof affect both selection and action.', choices: ['Treat profiles as a one-time setup', 'Govern listings, categories, reviews, and local proof', 'Focus only on national links'], answer: 1 },
      { id: 'km3', title: 'Forum reassurance', scenario: 'A user reads Reddit threads to understand whether hiring an attorney is worth it.', phase: 'prove', surface: 'reddit', insight: 'Community discussion reveals cost, trust, and process objections that owned content should resolve.', choices: ['Argue with every thread', 'Use recurring questions to improve education and consultation expectations', 'Ignore all offsite discussion'], answer: 1 },
      { id: 'km4', title: 'Entity inconsistency', scenario: 'Attorney information and practice descriptions differ across directories, Maps, and the site.', phase: 'prove', surface: 'reviews', insight: 'Inconsistent facts weaken both human confidence and machine understanding.', choices: ['Standardize entities and profiles', 'Create more social posts first', 'Change the firm name by platform'], answer: 0 },
      { id: 'km5', title: 'Lead friction', scenario: 'A user understands the service but cannot tell what happens after submitting the form.', phase: 'act', surface: 'owned', insight: 'The next step remains uncertain even after visibility and trust are earned.', choices: ['Explain the contact process and required information', 'Add another broad blog post', 'Hide phone numbers'], answer: 0 },
      { id: 'km6', title: 'Evidence gap', scenario: 'Competitors dominate comparison results with recent reviews, attorney profiles, and educational video.', phase: 'compare', surface: 'google', insight: 'The gap is not one ranking factor; it is a connected evidence system.', choices: ['Build coordinated education, profiles, review growth, and video proof', 'Rewrite one title tag only', 'Buy unrelated traffic'], answer: 0 }
    ]
  },
  signalLayers: {
    human: [
      { id: 'relevance', label: 'Relevance', detail: 'This appears to fit my exact situation.' },
      { id: 'clarity', label: 'Clarity', detail: 'I understand the answer and what to do next.' },
      { id: 'proof', label: 'Proof', detail: 'I can see evidence beyond the brand’s own claim.' },
      { id: 'consensus', label: 'Consensus', detail: 'Other sources and people reinforce the same conclusion.' },
      { id: 'convenience', label: 'Convenience', detail: 'The information and action are easy to access.' },
      { id: 'confidence', label: 'Confidence', detail: 'The remaining risk feels acceptable.' }
    ],
    machine: [
      { id: 'topics', label: 'Topics & entities', detail: 'Clear relationships between brand, product, service, people, and place.' },
      { id: 'citations', label: 'Links & citations', detail: 'Corroborating sources and references that support authority and understanding.' },
      { id: 'reviews', label: 'Reviews & mentions', detail: 'Third-party evidence, prominence, recency, and sentiment patterns.' },
      { id: 'structured', label: 'Structured facts', detail: 'Consistent, crawlable details, attributes, locations, and authorship.' },
      { id: 'engagement', label: 'Engagement signals', detail: 'Platform-specific evidence that content satisfies an audience.' },
      { id: 'freshness', label: 'Freshness & availability', detail: 'Current information, products, services, locations, and proof.' }
    ],
    business: [
      { id: 'visibility', label: 'Qualified visibility', detail: 'The brand appears in the right decision moments.' },
      { id: 'demand', label: 'Branded demand', detail: 'More people actively look for the brand after exposure or proof.' },
      { id: 'conversion', label: 'Conversion', detail: 'More qualified purchases, calls, forms, or visits occur.' },
      { id: 'retention', label: 'Retention', detail: 'The experience supports return behavior and repeat use.' },
      { id: 'reputation', label: 'Reputation', detail: 'Trust and recommendation signals become stronger over time.' },
      { id: 'learning', label: 'Faster learning', detail: 'Teams can see which audience uncertainties and surfaces matter.' }
    ]
  },
  roadmapTemplates: [
    { id: 'answer', label: 'Make an answer clearer', starter: 'Create or improve an owned answer that resolves…', owner: 'SEO + Content' },
    { id: 'proof', label: 'Add stronger proof', starter: 'Connect the decision moment with reviews, demonstrations, or third-party proof by…', owner: 'SEO + Client/Creative' },
    { id: 'offsite', label: 'Strengthen offsite visibility', starter: 'Help the brand appear more credibly on the relevant offsite surface by…', owner: 'SEO Consulting + Channel Owner' },
    { id: 'entity', label: 'Fix consistency', starter: 'Standardize the brand, person, product, service, or location information across…', owner: 'SEO + Client' },
    { id: 'connect', label: 'Connect two surfaces', starter: 'Use insight from one surface to improve another by…', owner: 'SEO Strategy' },
    { id: 'measure', label: 'Improve measurement', starter: 'Add a repeatable way to measure this decision moment by…', owner: 'SEO + Analytics' }
  ],
  clientObjections: [
    { id: 'co1', prompt: '“Isn’t Search Everywhere just social media marketing?”', guide: 'No. It maps where search behavior occurs and advises how the brand should become visible and persuasive. Execution may involve several teams.' },
    { id: 'co2', prompt: '“Why should SEO care about Reddit?”', guide: 'Reddit can shape validation, rank in Google, inform AI answers, and reveal audience language and objections.' },
    { id: 'co3', prompt: '“Why not put everything into Google?”', guide: 'Google remains critical, but users may form demand, gather proof, and make decisions across several surfaces.' },
    { id: 'co4', prompt: '“How do we know which platforms matter?”', guide: 'Start with audience jobs, observe actual search paths, collect evidence, and prioritize business fit rather than popularity.' },
    { id: 'co5', prompt: '“How can we measure platforms without keyword data?”', guide: 'Use native performance where available, directional trend evidence, qualitative intelligence, tagged traffic, and business outcomes.' },
    { id: 'co6', prompt: '“What does Lamark own?”', guide: 'Research, journey mapping, audit, strategy, prioritization, owned SEO execution, measurement, and coordination. Channel owners execute scoped offsite work.' },
    { id: 'co7', prompt: '“Are AI assistants a separate strategy?”', guide: 'They are a distinct surface within the same evidence ecosystem. Clear entities, answers, citations, and authority often support both AI and conventional search.' },
    { id: 'co8', prompt: '“Does every client need TikTok, Reddit, YouTube, Maps, and AI?”', guide: 'No. Search Everywhere is a prioritization model. Only surfaces that materially influence the audience journey should receive investment.' },
    { id: 'co9', prompt: '“What changes in our normal SEO roadmap?”', guide: 'The roadmap connects owned search work with offsite proof, local, video, community intelligence, entity consistency, and platform-specific measurement.' },
    { id: 'co10', prompt: '“How is this different from a content strategy?”', guide: 'Content is one response. Search Everywhere also covers local presence, reputation, platform proof, entities, community signals, conversion, and measurement.' }
  ],
  referenceAudit: [
    { client: 'Breezy', phase: 'Spark', surface: 'TikTok / Instagram', finding: 'Visual golf-style content can create demand before users articulate a product query.', recommendation: 'Build a small search-led creator and short-form test around priority categories.', confidence: 'Directional' },
    { client: 'Breezy', phase: 'Search', surface: 'Google / AI', finding: 'Category and value questions require stronger product facts and clear positioning.', recommendation: 'Strengthen category explanations, materials, fit, use cases, and corroborating proof.', confidence: 'High' },
    { client: 'Breezy', phase: 'Compare', surface: 'Google / YouTube', finding: 'Users need decision criteria that distinguish style, fit, material, and value.', recommendation: 'Create comparison-ready category and demonstration assets.', confidence: 'High' },
    { client: 'Breezy', phase: 'Prove', surface: 'Reviews / Reddit', finding: 'Fit, legitimacy, price, and customer experience are likely validation questions.', recommendation: 'Use review and community language to improve PDP proof and FAQs.', confidence: 'Directional' },
    { client: 'Breezy', phase: 'Act & Echo', surface: 'Owned / Reviews', finding: 'Post-purchase support and review behavior continue the search loop.', recommendation: 'Improve support findability and connect review capture to product learning.', confidence: 'High' },
    { client: 'K&P', phase: 'Spark', surface: 'Offline / Search', finding: 'A denial, delay, or underpayment creates an urgent information gap.', recommendation: 'Map issue language to plain-language education and local next steps.', confidence: 'High' },
    { client: 'K&P', phase: 'Search', surface: 'Google / AI', finding: 'Complex claim questions are well suited to explanatory and conversational search.', recommendation: 'Build issue-led guides with clear attorney, jurisdiction, and service connections.', confidence: 'High' },
    { client: 'K&P', phase: 'Compare', surface: 'Maps / Directories', finding: 'Practice fit, location, reviews, and responsiveness help narrow firms.', recommendation: 'Strengthen local profiles, practice categories, attorney entities, and contact clarity.', confidence: 'High' },
    { client: 'K&P', phase: 'Prove', surface: 'Reviews / Reddit', finding: 'Users seek independent reassurance about cost, process, trust, and whether representation is worthwhile.', recommendation: 'Use recurring objections to shape proof, expectations, and educational content.', confidence: 'Directional' },
    { client: 'K&P', phase: 'Act & Echo', surface: 'Owned / Maps', finding: 'Users need a clear contact process and may continue researching during the matter.', recommendation: 'Explain next steps, required information, response expectations, and ongoing resources.', confidence: 'High' }
  ]
});
