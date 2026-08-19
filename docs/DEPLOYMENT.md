# Deployment Guide

## Before deployment

Do not overwrite the existing GitHub Pages site until its current state is backed up. Use the sequence in `BACKUP_AND_DEPLOY.md` inside the checked-out `jpowers-lamark.github.io` repository.

## 1. Create the Supabase project

1. Create a Supabase project.
2. Open the SQL Editor.
3. Run `supabase/schema.sql` in full.
4. In Authentication settings, enable anonymous sign-ins.
5. Copy the project URL and publishable key from the project API settings.

## 2. Configure the website

From the project root:

```bash
npm run configure
```

The script writes the values to `assets/config.js` and keeps the rest of the application settings intact.

You may also edit the file manually:

```js
window.SE_CONFIG = Object.freeze({
  supabaseUrl: 'https://YOUR_PROJECT.supabase.co',
  supabaseAnonKey: 'YOUR_PUBLISHABLE_KEY',
  enableDemoFallback: true,
  appName: 'Lamark Search Everywhere Lab',
  defaultStageSeconds: 480,
  maxParticipants: 12,
  debug: false
});
```

Never put a Supabase service-role key in this file. The website must use only the publishable browser key.

## 3. Validate locally

```bash
npm run validate
npm run serve
```

Open `http://localhost:4173/?preview=1` for local preview.

For a multi-device test, deploy to a temporary branch or Pages environment and create a live room. Test with at least two browsers or devices.

## 4. Publish with GitHub Actions

The included workflow at `.github/workflows/pages.yml` publishes only the website runtime files. Documentation, tests, and database scripts remain in the repository but are not copied into the deployed artifact.

In the GitHub repository:

1. Open **Settings → Pages**.
2. Set **Source** to **GitHub Actions**.
3. Commit and push to `main`.
4. Open the workflow run and verify the `build` and `deploy` jobs.
5. Confirm the production site and a live room on two devices.

## 5. Deployment verification checklist

- Home screen loads without console errors.
- Favicon and application manifest load.
- Preview mode works with `?preview=1`.
- Facilitator can create a room.
- A second device can join using the room code.
- Both devices show the participant roster.
- Remote cursors appear only on the same active stage.
- Facilitator stage changes synchronize.
- Poll responses update without refresh.
- Evidence cards persist and move live.
- Audit filters and CSV export work.
- Signal Auction totals persist.
- Strategy votes and teach-back ratings synchronize.
- Mobile layout remains usable.

## 6. Rollback

If production verification fails:

1. Revert the deployment commit, or reset `main` to the backup tag created before replacement.
2. Push the rollback commit.
3. Confirm the Pages workflow redeploys the previous site.
4. Keep the failed version on a separate branch for debugging.

## 7. Session cleanup

After exporting the workshop:

1. Review `supabase/cleanup.sql`.
2. Set an appropriate retention period.
3. Run it in Supabase SQL Editor.
4. Confirm that only expired workshop rooms and their dependent records were removed.
