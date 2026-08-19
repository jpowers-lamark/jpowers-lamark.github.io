#!/usr/bin/env bash
set -euo pipefail

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Run this script inside the existing jpowers-lamark.github.io Git repository." >&2
  exit 1
fi

repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"

timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
branch="backup/pre-search-everywhere-${timestamp}"
tag="pre-search-everywhere-${timestamp}"
repo_name="$(basename "$repo_root")"
backup_root="$(dirname "$repo_root")/${repo_name}-site-backups"
mkdir -p "$backup_root"

current_branch="$(git branch --show-current || true)"
current_head="$(git rev-parse HEAD)"
status_file="$backup_root/status-${timestamp}.txt"
working_tree_archive="$backup_root/working-tree-${timestamp}.tar.gz"
git_bundle="$backup_root/repository-${timestamp}.bundle"

printf 'Repository: %s\nBranch: %s\nHEAD: %s\nUTC: %s\n\n' "$repo_root" "$current_branch" "$current_head" "$timestamp" > "$status_file"
git status --short --branch >> "$status_file"
git diff > "$backup_root/unstaged-${timestamp}.patch"
git diff --cached > "$backup_root/staged-${timestamp}.patch"

git branch "$branch" "$current_head"
git tag -a "$tag" "$current_head" -m "Backup before Search Everywhere Lab deployment ${timestamp}"
git bundle create "$git_bundle" --all

tar --exclude='.git' --exclude='node_modules' --exclude='.DS_Store' -czf "$working_tree_archive" -C "$repo_root" .

if [[ "${1:-}" == "--push" ]]; then
  remote="${2:-origin}"
  git push "$remote" "$branch"
  git push "$remote" "$tag"
  pushed="yes"
else
  pushed="no"
fi

cat <<SUMMARY
Backup complete.

Backup branch:  $branch
Backup tag:     $tag
Git bundle:     $git_bundle
Working tree:   $working_tree_archive
Status record:  $status_file
Pushed:         $pushed

Keep these names until the new Pages deployment is verified.
SUMMARY
