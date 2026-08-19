# Lamark Search Everywhere Lab

A live workshop and audit application for teaching **Search Everywhere** through active participation. The application uses Breezy Golf and Kanner & Pintaluga as contrasting case studies so the team can see how audience behavior changes across ecommerce, social search, local search, AI answers, reputation, video, community discussion, and owned websites.

## What is included

- A 14-stage facilitator-led workshop
- Live participant presence and shared cursors
- A team poll that makes fragmented search behavior visible
- An interactive search-surface and signal map
- A full audience journey builder
- Two client portals for Breezy Golf and Kanner & Pintaluga
- A filterable audit command center with 55 worked findings
- A 32-source evidence register, including clearly labeled directional Reddit/community research
- A shared evidence whiteboard
- A 100-credit Signal Auction
- A Human + Machine signal-mapping activity
- Search Shock scenario simulations
- A weighted Strategy War Room
- Client-objection teach-back and participant scoring
- Session export to CSV
- Local preview mode when no realtime service is configured

## Architecture

```text
GitHub Pages
  └─ Static HTML, CSS, JavaScript, workshop data, visual interface

Supabase
  ├─ Anonymous participant authentication
  ├─ PostgreSQL persistence
  ├─ Realtime presence
  ├─ Broadcast cursors and drag movement
  └─ Live room, item, vote, and stage synchronization
```

GitHub Pages alone cannot provide shared state or live cursors. Supabase supplies the realtime layer while the website remains a static GitHub Pages deployment.

## Fast start

1. Open `supabase/schema.sql` in a new Supabase project and run it.
2. Enable anonymous sign-ins in Supabase Authentication.
3. Run `npm run configure` and paste the project URL and publishable key.
4. Run `npm run validate`.
5. Run `npm run serve`, then open `http://localhost:4173`.
6. Follow `BACKUP_AND_DEPLOY.md` before replacing the existing GitHub Pages site. The safest local install command is `bash scripts/install-into-repo.sh /absolute/path/to/jpowers-lamark.github.io`.

The publishable browser key is expected to be visible in the client application. Access is controlled by Row Level Security and workshop membership policies in `supabase/schema.sql`.

## Preview mode

Without Supabase credentials, the application opens in preview mode. It persists locally and synchronizes across tabs in the same browser through `BroadcastChannel`, which is useful for content review and facilitator rehearsal. Real multi-device participation requires Supabase.

## Standalone preview

`Search_Everywhere_Lab_Standalone_Preview.html` is a one-file offline review build. It opens directly in preview mode and is useful for reviewing the curriculum and interface without a server. It does not provide real multi-device collaboration.

## Visual QA preview

A six-stage interface contact sheet is included at `docs/screenshots/Search_Everywhere_Lab_Visual_QA.png`.

## Validation

```bash
npm run validate
```

The validator checks:

- Required files
- JavaScript syntax
- Local asset references
- Duplicate HTML IDs
- Expected workshop and audit counts
- Unique seed IDs
- Source URL validity
- Required realtime and workshop capabilities

## Repository map

```text
.
├── index.html
├── assets/
│   ├── app.js
│   ├── config.js
│   ├── data.js
│   ├── realtime.js
│   ├── styles.css
│   ├── search-everywhere-operating-model.svg
│   └── og-search-everywhere.jpg
├── supabase/
│   ├── schema.sql
│   ├── cleanup.sql
│   └── README.md
├── scripts/
│   ├── backup-current.sh
│   ├── configure-supabase.mjs
│   ├── install-into-repo.sh
│   └── validate.mjs
├── tests/
│   └── browser-smoke.py
├── docs/
│   ├── ARCHITECTURE.md
│   ├── DEPLOYMENT.md
│   ├── FACILITATOR_GUIDE.md
│   ├── WORKSHOP_RUN_OF_SHOW.md
│   ├── AUDIT_METHOD.md
│   ├── QA_REPORT.md
│   └── screenshots/
├── Search_Everywhere_Lab_Standalone_Preview.html
├── .github/workflows/pages.yml
└── BACKUP_AND_DEPLOY.md
```

## Privacy and session hygiene

- Use non-sensitive examples during team training.
- Do not paste privileged legal information, client credentials, personal health information, or customer records into workshop fields.
- Workshop rooms use short access codes. Share room links only with intended participants.
- Remove old workshop rooms with `supabase/cleanup.sql` after exports are saved.
- Review Supabase usage and security settings before using the application for external client sessions.

## Ownership

Internal Lamark training asset. Review client-specific findings before external circulation because public-site observations can change.
