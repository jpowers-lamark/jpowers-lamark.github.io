#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage:
  bash scripts/install-into-repo.sh /absolute/path/to/jpowers-lamark.github.io [--push-backup]

What it does:
  1. Verifies the target is a Git repository.
  2. Creates a timestamped backup branch, tag, Git bundle, patches, and working-tree archive.
  3. Preserves an existing CNAME file.
  4. Replaces the site files with this Search Everywhere Lab package.
  5. Runs repository validation.

What it does not do:
  It does not commit, push, configure Supabase, or change GitHub settings.
USAGE
}

if [[ $# -lt 1 || "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit $([[ $# -lt 1 ]] && echo 1 || echo 0)
fi

source_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
target_root="$(cd "$1" 2>/dev/null && pwd || true)"
push_flag="${2:-}"

if [[ -z "$target_root" || ! -d "$target_root" ]]; then
  echo "Target directory does not exist: $1" >&2
  exit 1
fi

if ! git -C "$target_root" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Target is not a Git repository: $target_root" >&2
  exit 1
fi

if [[ ! -f "$source_root/index.html" || ! -f "$source_root/assets/app.js" ]]; then
  echo "Source package is incomplete: $source_root" >&2
  exit 1
fi

if [[ "$source_root" == "$target_root" ]]; then
  echo "Source and target are the same directory. Use the package from outside the live repository." >&2
  exit 1
fi

remote_summary="$(git -C "$target_root" remote -v 2>/dev/null || true)"
if [[ -n "$remote_summary" && "$remote_summary" != *"jpowers-lamark.github.io"* ]]; then
  echo "Warning: target remotes do not contain jpowers-lamark.github.io." >&2
  printf '%s\n' "$remote_summary" >&2
fi

backup_args=()
if [[ "$push_flag" == "--push-backup" ]]; then
  backup_args=(--push origin)
elif [[ -n "$push_flag" ]]; then
  echo "Unknown option: $push_flag" >&2
  usage
  exit 1
fi

printf '\nCreating recoverable backup...\n'
(
  cd "$target_root"
  bash "$source_root/scripts/backup-current.sh" "${backup_args[@]}"
)

cname_temp=""
if [[ -f "$target_root/CNAME" ]]; then
  cname_temp="$(mktemp)"
  cp "$target_root/CNAME" "$cname_temp"
fi

printf '\nInstalling Search Everywhere Lab files...\n'
rsync -a --delete \
  --exclude '.git/' \
  --exclude 'node_modules/' \
  --exclude '.DS_Store' \
  --exclude 'CNAME' \
  "$source_root/" "$target_root/"

if [[ -n "$cname_temp" ]]; then
  cp "$cname_temp" "$target_root/CNAME"
  rm -f "$cname_temp"
fi

printf '\nRunning validation in target repository...\n'
(
  cd "$target_root"
  npm run validate
)

cat <<SUMMARY

Installation complete and not yet pushed.

Target: $target_root
Next review commands:
  cd "$target_root"
  git status
  git diff --stat
  npm run serve

After Supabase is configured and multi-device QA passes:
  git add -A
  git commit -m "Launch Lamark Search Everywhere workshop lab"
  git push origin main
SUMMARY
