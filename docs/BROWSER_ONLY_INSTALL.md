# Browser-Only GitHub Update Instructions

No Terminal, Node, Git command, or local repository is required.

## 1. Add the v2 collaboration tables in Supabase

1. Open your existing Supabase project.
2. Open **SQL Editor**.
3. Click **New query**.
4. In this package, open `supabase/workshop_v2.sql`.
5. Copy the entire file into the SQL Editor.
6. Click **Run**.
7. Confirm the result says the query succeeded.
8. Open **Table Editor** and confirm these four new tables exist:
   - `se_workshop_rooms`
   - `se_workshop_participants`
   - `se_workshop_items`
   - `se_workshop_votes`

The SQL uses new v2 table names. It does not delete the prior workshop tables or prior room data.

## 2. Preserve the working Supabase configuration

Do **not** delete or replace this existing GitHub file:

`assets/config.js`

It already contains the working Supabase Project URL and publishable key.

This update package intentionally does not include `assets/config.js`.

## 3. Upload the replacement files through GitHub

Replace these root files:

- `index.html`
- `404.html`
- `robots.txt`
- `.nojekyll`

Replace these files inside the `assets` folder:

- `app.js`
- `content.js`
- `realtime.js`
- `styles.css`

Upload these optional documentation files:

- `README.md`
- `docs/FACILITATOR_GUIDE.md`
- `docs/QA_REPORT.md`

Upload this SQL file for future reference:

- `supabase/workshop_v2.sql`

Do not upload `assets/config.example.js` over `assets/config.js`. The example file has a different filename and is safe to keep as documentation.

## 4. Commit the GitHub changes

Use this commit message:

`Launch guided Search Everywhere Learning Lab v2`

Commit to the branch currently used by GitHub Pages, normally `main`.

## 5. Wait for GitHub Pages

1. Open the repository’s **Actions** tab.
2. Wait for the Pages deployment to finish with green checks.
3. Open `https://jpowers-lamark.github.io/index.html`.
4. Hard refresh:
   - Mac: `Command + Shift + R`
   - Windows: `Ctrl + Shift + R`

The page uses `?v=2.0.0` asset versions to reduce stale-cache problems.

## 6. Test a new v2 room

Old v1 room codes will not carry into the v2 tables. Create a new room.

From Computer 1:

1. Enter a name.
2. Leave the room code blank.
3. Click **Create live room**.
4. Confirm the connection says **Live room connected**.
5. Copy the new room code.

From Computer 2:

1. Open the same `/index.html` URL.
2. Enter another name and the new room code.
3. Click **Join room**.
4. Confirm both participants appear.

## 7. Required live checks

- Participant names appear without refreshing.
- Remote cursors appear while both users are on the same stage.
- Facilitator stage changes synchronize.
- Opening poll results update room-wide.
- Typing in any form does not disappear during remote activity.
- Wheel spins and the selected participant appear on both screens.
- Wheel answers appear on the shared teach-back wall.
- Each 100-credit allocation saves and appears in the room aggregate.
- Micro-mission answers appear on the shared learning wall.
- Evidence chains appear for both Breezy and K&P participants.
- Roadmap cards appear, move, and retain votes on both screens.
- Commitments remain after refreshing the page.
- CSV and room-backup exports download successfully.

## Rollback

The v2 update does not delete the old Supabase tables. The prior GitHub backup can be restored if required. Do not remove the old backup until the v2 room passes the two-device test.
