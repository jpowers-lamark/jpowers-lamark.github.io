# Browser-Only Update and Deployment Guide

This guide assumes:

- The website is already in `jpowers-lamark/jpowers-lamark.github.io`.
- The previous site has already been backed up.
- GitHub Pages is already publishing from GitHub Actions.
- Supabase is already connected and live rooms work.
- You do not want to use Terminal.

## Before uploading the website files

The v3 application introduces four new persistent activity types:

- `cognitive_profile`
- `knowledge_answer`
- `journey_prediction`
- `wheel_response`

The existing Supabase database must recognize these types before the updated website is used.

## Step 1: Run the Supabase v3 upgrade

1. Open the GitHub update package on your computer.
2. Open `supabase/v3-upgrade.sql` in a text editor.
3. Select and copy the entire file.
4. Open your Supabase project in the browser.
5. Select **SQL Editor**.
6. Select **New query**.
7. Paste the complete SQL file.
8. Select **Run**.

The migration only replaces the item-type validation constraint. It does not delete rooms, participants, whiteboard cards, votes, audit findings, strategies, or prior workshop records.

Do not run `cleanup.sql` during this update.

## Step 2: Preserve the existing Supabase configuration

In the GitHub repository, confirm that this file already exists:

```text
assets/config.js
```

Do not delete or replace it.

The update ZIP intentionally omits this file. If you upload the folder structure through GitHub, verify that `assets/config.js` remains present after the upload.

## Step 3: Upload the update to GitHub

GitHub's browser uploader works best in smaller groups because it does not reliably upload nested folders as one operation in every browser.

### Root files

At the repository root, upload and replace:

```text
index.html
404.html
manifest.webmanifest
robots.txt
README.md
BACKUP_AND_DEPLOY.md
SECURITY.md
package.json
```

### Assets folder

Open the repository's `assets` folder and upload and replace:

```text
app.js
data.js
realtime.js
styles.css
favicon.svg
search-everywhere-operating-model.svg
og-search-everywhere.jpg
```

Do not replace `config.js`.

### Supabase folder

Open the repository's `supabase` folder and upload and replace:

```text
schema.sql
v3-upgrade.sql
cleanup.sql
README.md
```

### Documentation and supporting files

The `docs`, `scripts`, and `tests` folders are useful for auditability and future maintenance. Upload them if you want the repository to retain the full package. They are not required by the public runtime.

### GitHub Pages workflow

Open `.github/workflows` and replace `pages.yml` if the update package contains a newer version.

## Step 4: Commit the changes

Use this commit message:

```text
Launch Search Everywhere Experience Lab v3
```

Commit directly to `main`, or create and merge a pull request if branch protection requires it.

## Step 5: Confirm GitHub Pages deployment

1. Open the repository's **Actions** tab.
2. Open **Deploy Search Everywhere Experience Lab to GitHub Pages**.
3. Confirm that both `build` and `deploy` finish with successful checkmarks.
4. Open `https://jpowers-lamark.github.io/index.html`.
5. Perform a hard refresh.

Hard refresh shortcuts:

- macOS: `Command + Shift + R`
- Windows: `Ctrl + Shift + R`

The updated page loads `assets/app.js?v=3.0.0`, which reduces the risk of old JavaScript remaining in browser cache.

## Step 6: Run a two-computer production test

Create a new room rather than reusing an old test room.

Confirm all of the following:

- Both computers display **Live room connected**.
- The second participant appears in the room roster.
- Facilitator stage changes synchronize.
- Shared cursors are visible while both users are on the same stage.
- Cognitive profile results appear room-wide.
- Knowledge-check results save.
- Journey predictions and transition insights appear without refresh.
- Whiteboard cards save, move, and retain their positions.
- The Operator Selector result appears for the entire room.
- Each 100-credit allocation saves and contributes to the room-wide average.
- Human + Machine signal chains appear for everyone.
- Search Shock responses persist.
- Strategy votes and roadmap views update room-wide.
- Active typing is not erased by another participant's activity.
- Refreshing one browser does not remove saved room content.

## If a new activity does not save

The most likely cause is that `supabase/v3-upgrade.sql` was not run successfully.

Return to the Supabase SQL Editor, rerun the complete migration, then create a new workshop room and test again.

## If the site displays an older version

1. Confirm the latest GitHub Action completed.
2. Open the explicit `/index.html` URL.
3. Hard refresh.
4. Open the page in a private browser window.
5. Confirm the page source references `assets/app.js?v=3.0.0`.
