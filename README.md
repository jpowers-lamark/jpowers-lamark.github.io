# Lamark Search Everywhere Experience Lab

The Search Everywhere Experience Lab is a live, multi-user strategy workshop for Lamark's SEO team. It teaches how people move across search engines, AI assistants, social search, video, communities, maps, reviews, directories, shopping surfaces, and owned websites while resolving a decision.

This release restores the depth of the original workshop and adds a research-based cognitive search layer, nonlinear journey simulation, room-wide resource allocation, live participant selection, evidence mapping, strategic scoring, and client communication practice.

## Workshop structure

The application contains 16 connected stages:

1. Enter Mission Control
2. The Search Fracture
3. The Cognitive Search Reactor
4. What Search Everywhere Means
5. The Search Ecosystem
6. The Decision Journey Simulator
7. Client Portals
8. Audit Command Center
9. Evidence Whiteboard
10. The Operator Selector
11. Signal Auction
12. Human + Machine Signal Decoder
13. Search Shock
14. Strategy War Room
15. Client Challenge
16. Lock In the Operating System

## What participants do

- Join a live workshop room from separate computers
- See participant presence and room-wide cursor activity
- Compare where the room begins search and what changes the next move
- Simulate how urgency, risk, familiarity, and credibility affect platform choice
- Model a seven-stage, nonlinear search journey
- Compare Breezy Golf and Kanner & Pintaluga as distinct decision systems
- Inspect 55 worked audit findings and challenge the evidence
- Add and move shared whiteboard cards
- Allocate exactly 100 visibility credits and compare room-wide results
- Connect human perceptions to observable behavior, machine-readable signals, and business outcomes
- Respond to a sudden Search Shock
- Score, vote, sequence, and defend roadmap initiatives
- Practice client-facing explanations under pressure
- Export the room's evidence, decisions, and strategy

## Live architecture

```text
GitHub Pages
  Static application, interface, workshop content, audit evidence, visuals

Supabase
  Anonymous participation, room state, persistence, votes, presence, cursors,
  shared cards, facilitator controls, and realtime synchronization
```

## Updating an existing deployment

This update is designed for an existing GitHub Pages installation that already has a working Supabase connection.

1. In Supabase, open the SQL Editor.
2. Run `supabase/v3-upgrade.sql` once.
3. In GitHub, upload and replace the files in this package.
4. Do not replace `assets/config.js`.
5. Commit the changes to `main`.
6. Wait for the GitHub Pages Action to finish.
7. Hard refresh `https://jpowers-lamark.github.io/index.html`.
8. Test a new room from two computers.

See `BACKUP_AND_DEPLOY.md` for the exact browser-only sequence.

## Important configuration rule

The update package intentionally omits `assets/config.js`. The existing production file contains the Supabase project URL and publishable key. Preserve it.

Never place a Supabase secret key, service-role key, database password, or client credential in the repository.

## Research basis

The cognitive layer synthesizes established work on anomalous states of knowledge, the information search process, information foraging, query reformulation, credibility assessment, satisficing, and contemporary generative-AI information seeking.

See `docs/RESEARCH_BASIS.md` for the research model and source register.

## Repository map

```text
.
├── index.html
├── assets/
│   ├── app.js
│   ├── data.js
│   ├── realtime.js
│   ├── styles.css
│   ├── favicon.svg
│   └── search-everywhere-operating-model.svg
├── supabase/
│   ├── schema.sql
│   ├── v3-upgrade.sql
│   ├── cleanup.sql
│   └── README.md
├── docs/
│   ├── ARCHITECTURE.md
│   ├── DEPLOYMENT.md
│   ├── FACILITATOR_GUIDE.md
│   ├── WORKSHOP_RUN_OF_SHOW.md
│   ├── AUDIT_METHOD.md
│   ├── RESEARCH_BASIS.md
│   └── QA_REPORT.md
├── scripts/
├── tests/
├── Search_Everywhere_Lab_Standalone_Preview.html
├── .github/workflows/pages.yml
└── BACKUP_AND_DEPLOY.md
```

## Privacy and workshop hygiene

- Use non-sensitive examples during internal training.
- Do not enter privileged legal information, credentials, customer records, personal health information, or confidential client data.
- Share room codes only with intended participants.
- Export and retain workshop records according to Lamark's internal practices.
- Validate public client facts before external circulation.

Internal Lamark training asset, version 3.0.0.
