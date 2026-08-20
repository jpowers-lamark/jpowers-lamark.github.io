# Supabase Setup and v3 Migration

## Files

- `schema.sql` creates a new Search Everywhere workshop database from the beginning.
- `v3-upgrade.sql` updates an existing production database to accept the new v3 activity records.
- `cleanup.sql` removes expired workshop rooms and dependent session data when intentionally run.

## Existing production installation

For an existing live installation, run `v3-upgrade.sql` once through the Supabase browser SQL Editor before uploading the v3 website files.

The migration is non-destructive. It replaces only the `workshop_items_item_type_check` constraint so the database accepts:

- `cognitive_profile`
- `knowledge_answer`
- `journey_prediction`
- `wheel_response`

It preserves existing rooms, members, cards, votes, findings, allocations, strategies, ratings, and takeaways.

## Required authentication setting

Enable **Anonymous Sign-Ins** in Supabase Authentication. Anonymous users receive authenticated identities, allowing Row Level Security to restrict access by workshop membership.

## Browser configuration

Use only the Supabase project URL and publishable key in `assets/config.js`.

Never place any of the following in browser code or a public repository:

- Secret key
- Service-role key
- Database password
- Client credentials

## Tables

| Table | Purpose |
|---|---|
| `workshop_rooms` | Facilitator, stage, client, timer, settings, room status |
| `workshop_members` | Participant identity, role, team, display color |
| `workshop_items` | Shared responses, evidence, cards, allocations, chains, strategies, ratings, commitments |
| `workshop_votes` | Participant votes by room and target |

## Realtime behavior

Persistent changes use Postgres Changes. Presence, cursors, reactions, and drag previews use room-specific realtime channels.

## Production checks

- Row Level Security is enabled on all workshop tables.
- Anonymous sign-ins are enabled.
- Realtime publication includes rooms, items, and votes.
- `v3-upgrade.sql` has run successfully.
- No service-role or secret key appears in the repository.
- Invalid room codes are rejected.
- The participant cap is enforced.
- Only facilitators can change facilitator-controlled stage state.
- New v3 activities save and appear on a second computer.
- Cleanup is run only according to the agreed retention policy.
