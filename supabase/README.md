# Supabase Setup

## Files

- `schema.sql` creates the workshop tables, RPCs, indexes, Row Level Security policies, grants, and Realtime publication entries.
- `cleanup.sql` removes expired workshop rooms and dependent session data.

## Required project setting

Enable **Anonymous Sign-Ins** in Supabase Authentication. Anonymous users still receive authenticated identities, which allows the Row Level Security policies to scope reads and writes to workshop membership.

## Browser configuration

Use only the project URL and publishable browser key in `assets/config.js`. Never use the service-role key in client-side code.

## Tables

| Table | Purpose |
|---|---|
| `workshop_rooms` | Facilitator, active stage, active client, timer, room settings |
| `workshop_members` | Participant identity, team, role, display color |
| `workshop_items` | Polls, journey entries, evidence, audit findings, allocations, responses, strategy, ratings, takeaways |
| `workshop_votes` | One participant vote per target |

## Realtime channels

The application uses room-specific channels. Presence and Broadcast events are ephemeral. Persistent records are synchronized through Postgres Changes.

## Recommended production checks

- Confirm Row Level Security is enabled on all four tables.
- Confirm anonymous sign-ins are enabled.
- Confirm the `supabase_realtime` publication contains rooms, items, and votes.
- Confirm no service-role key appears in the repository.
- Test joining with an invalid code.
- Test the 12-participant cap.
- Test that one participant cannot update another participant’s item.
- Test that only the facilitator can change the room stage.
- Set a session-retention policy and run cleanup routinely.
