# Application Architecture

## Design goal

The Search Everywhere Lab is intentionally split into a static presentation layer and a realtime collaboration layer. This keeps GitHub Pages deployment simple while still supporting a live room where 6–8 people can see one another, move through the same workshop, add evidence, vote, and build strategy without refreshing.

## Runtime topology

```text
Participant browser A ─┐
Participant browser B ─┼── GitHub Pages static assets
Participant browser C ─┘          │
                                  │ ES modules
                                  ▼
                         Search Everywhere UI
                                  │
                    Supabase JavaScript client
                                  │
                 ┌────────────────┴────────────────┐
                 ▼                                 ▼
        Supabase Realtime                    Supabase Postgres
        - Presence                           - Rooms
        - Cursor broadcast                   - Members
        - Card movement                      - Items
        - Reactions                          - Votes
        - Activity signals                   - Persistent stage state
```

## Front-end modules

### `assets/data.js`

Contains the workshop curriculum and worked audit data:

- 14 workshop stages
- Platform definitions
- Journey stages
- Signal definitions
- Breezy and KP client models
- Search Shock scenarios
- Client objections
- 55 seed audit findings
- Source register

This file is deliberately separate from the UI so future client examples can be added without rewriting the application framework.

### `assets/realtime.js`

Provides one interface for two modes:

**Supabase mode**

- Anonymous sign-in
- Create or join room RPC
- Realtime presence
- Broadcast events
- Postgres change subscriptions
- Persistent writes for items and votes

**Local mode**

- `localStorage` persistence
- `BroadcastChannel` synchronization
- Same-browser rehearsal across multiple tabs

### `assets/app.js`

Controls:

- Stage rendering
- Navigation and facilitator following
- Polling and vote aggregation
- Journey construction
- Audit filtering and editing
- Whiteboard drag behavior
- Signal Auction allocation
- Human + Machine connection mapping
- Search Shock responses
- Weighted strategy scoring
- Teach-back ratings
- CSV export

### `assets/styles.css`

Uses a white editorial system with restrained brand accents. It includes responsive layouts, reduced-motion behavior, print rules, accessible focus states, and the shared-cursor presentation.

## Realtime event model

### Persistent events

Stored in PostgreSQL and delivered with Postgres Changes:

- Active workshop stage
- Timer state
- Poll selections
- Journey entries
- Audit findings
- Evidence cards
- Signal Auction allocations
- Human + Machine connections
- Search Shock responses
- Strategy initiatives
- Votes
- Teach-back ratings
- Takeaways

### Ephemeral events

Sent through Broadcast and not stored:

- Cursor movement
- In-progress card movement
- Reactions
- Lightweight activity notifications

This separation keeps high-frequency activity out of the database while preserving the outputs the team needs after the workshop.

## Security model

- Participants authenticate anonymously and receive a unique `auth.users` identity.
- A participant can read a room only after joining it through the room-code RPC.
- A participant may insert only records owned by their own user ID.
- Participants may update or delete their own records.
- Facilitators may update or delete room items.
- Only the room facilitator may change the active stage and timer.
- Vote rows are unique by room, target, and participant.
- Room size is capped at 12 in the join function.

The website’s publishable key is not treated as a secret. Authorization is enforced by Row Level Security.

## Scale assumptions

The application is tuned for a facilitated session of 6–8 people, with a hard room cap of 12. Cursor and card-movement events are throttled. Persistent records are small JSON payloads with a database-level size check.

## Failure behavior

- If Supabase is not configured, the application enters local preview mode.
- If a persistent write fails, the UI reports the error rather than silently claiming success.
- If a participant loses connectivity, persisted outputs remain in PostgreSQL and presence is restored after reconnection.
- A session can be exported to CSV before cleanup.

## Future extensions

- Private Realtime channels with authorization
- SSO for internal-only access
- Facilitator-generated room links with expiration
- Client-specific data packs loaded from separate modules
- Screenshot or evidence-file uploads through object storage
- Session analytics and workshop completion reporting
