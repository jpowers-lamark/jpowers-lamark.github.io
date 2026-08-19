# Security Notes

## Supported deployment

The supported deployment is a static GitHub Pages site using a dedicated Supabase project for realtime state.

## Do not store sensitive information

The workshop is designed for training, public-site observations, and strategic planning. Do not enter:

- Client credentials
- Customer records
- Privileged legal information
- Personal health information
- Payment information
- Private employee information
- Unreleased client data that is not approved for the room

## Browser key

Only the Supabase publishable browser key belongs in `assets/config.js`. Never commit a service-role key.

## Access control

- Anonymous users must join a valid workshop room before they can read its records.
- Row Level Security scopes reads and writes to room membership.
- Participants own their own records.
- Facilitators control room stage and timer state.
- Room membership is capped at 12.

Room codes are access mechanisms, not high-assurance secrets. Share room links only with intended participants.

## Retention

Export the session, then remove expired rooms with `supabase/cleanup.sql` according to the team’s retention policy.

## Reporting a problem

Do not post credentials, room data, or client information in a public issue. Report security concerns privately to the repository owner.
