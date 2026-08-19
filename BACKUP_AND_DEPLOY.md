# Safe Replacement of `jpowers-lamark.github.io`

The current site must be recoverable before any files are replaced.

## One-command safe installation

From the extracted Search Everywhere Lab package, run:

```bash
bash scripts/install-into-repo.sh /absolute/path/to/jpowers-lamark.github.io
```

This creates the backup artifacts, preserves an existing `CNAME`, copies the new site, and validates the target repository. It intentionally stops before commit or push. Add `--push-backup` only when the current repository remote is verified and you want the backup branch and tag sent to `origin`.

## Recommended sequence

Run these commands inside the existing local clone of `jpowers-lamark.github.io`.

```bash
# 1. Confirm the repository and branch
git status
git remote -v
git branch --show-current

# 2. Save any uncommitted work before continuing
git add -A
git commit -m "Backup current GitHub Pages site before Search Everywhere Lab" || true

# 3. Create a timestamped backup branch and tag
bash /path/to/search-everywhere-lab/scripts/backup-current.sh

# 4. Copy the new application into the repository
rsync -av --delete \
  --exclude '.git/' \
  --exclude 'node_modules/' \
  /path/to/search-everywhere-lab/ ./

# 5. Validate before committing
npm run validate

# 6. Review the change set
git status
git diff --stat
git diff

# 7. Commit and push
git add -A
git commit -m "Launch Lamark Search Everywhere workshop lab"
git push origin main
```

## Recovery commands

The backup script prints the branch and tag it created. To restore the previous site:

```bash
git checkout main
git reset --hard BACKUP_TAG_NAME
git push --force-with-lease origin main
```

Use force-with-lease only after confirming no other person has pushed legitimate work to `main`.

## Safer staged launch

For a lower-risk review, push this application to a separate branch first:

```bash
git checkout -b search-everywhere-lab-preview
git add -A
git commit -m "Preview Search Everywhere workshop lab"
git push -u origin search-everywhere-lab-preview
```

Then use a temporary Pages workflow environment or a fork for team QA before merging to `main`.
