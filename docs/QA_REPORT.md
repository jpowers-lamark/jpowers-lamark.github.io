# Quality Assurance Report

**Build:** Lamark Search Everywhere Lab 1.0.0  
**QA date:** August 19, 2026  
**Target:** GitHub Pages static site with Supabase realtime collaboration

## Automated validation

The repository validator completed with:

- 118 passed checks
- 0 failures
- 1 expected warning because production Supabase credentials are intentionally blank in the distributable package

Checks include:

- Required project files
- JavaScript syntax
- HTML ID uniqueness
- Local asset resolution
- Workshop data counts
- Unique data IDs
- Source URL formatting across 32 registered sources
- Audit row structure
- Required application capabilities
- Realtime and Row Level Security markers
- Service-role key exclusion
- Deployable runtime files

## Browser smoke test

A real Chromium smoke test passed:

- 14 workshop stages rendered
- 55 seed audit rows rendered
- Breezy filter returned 24 findings
- Live poll selection worked
- Evidence card creation worked
- Strategy initiative creation worked
- No browser console or page errors were recorded

## Safe installer integration test

The one-command installer was tested against a temporary Git repository containing an existing site and `CNAME` file. The test confirmed:

- Timestamped backup branch and tag creation
- Git bundle and working-tree archive creation
- Existing `CNAME` preservation
- New application file installation
- Target-repository validation
- No automatic commit or push

## Static HTTP test

Local server checks returned:

- `index.html`: HTTP 200
- `assets/app.js`: HTTP 200 with JavaScript content type
- `manifest.webmanifest`: readable
- Unknown route: HTTP 404

## Realtime code review

Implemented and checked:

- Anonymous participant identity
- Room creation and join functions
- Room membership enforcement
- Participant presence
- Same-stage shared cursors
- Throttled cursor and card-movement broadcast
- Facilitator-controlled stage and timer state
- Persistent room items and votes
- Local fallback for rehearsal
- Safe storage fallback for restricted browser origins
- Session export

## Remaining production test

A true multi-device test cannot run until a Supabase project URL and publishable key are configured. After configuration, test with two separate devices before replacing the existing public site. Follow the checklist in `docs/DEPLOYMENT.md`.
