#!/usr/bin/env bash
set -e

# ==========================================
# INSTALL CEO GIT HOOKS (2026 Enterprise)
# ==========================================
# Installs a strict commit-msg hook locally in the repo.
# Ensures the message matches: (Fixes|Resolves|Updates|Closes|Refs) #ID

if [ ! -d ".git" ]; then
  echo "Error: Must be run from the root of a git repository."
  exit 1
fi

HOOK_DIR=".git/hooks"
COMMIT_MSG_HOOK="$HOOK_DIR/commit-msg"

mkdir -p "$HOOK_DIR"

cat << 'HOOK_EOF' > "$COMMIT_MSG_HOOK"
#!/bin/sh

# Regex to check for issue references
ISSUE_REGEX="(Fixes|Resolves|Updates|Closes|Refs) #[0-9]+"
MERGE_REGEX="^Merge "

MSG_FILE=$1
MSG_CONTENT=$(cat "$MSG_FILE")

# Allow merge commits without issue refs
if echo "$MSG_CONTENT" | grep -iqE "$MERGE_REGEX"; then
  exit 0
fi

if ! echo "$MSG_CONTENT" | grep -iqE "$ISSUE_REGEX"; then
  echo ""
  echo "🚨 [KING CEO COMMIT LOCK] 🚨"
  echo "ERROR: Your commit message is missing a valid GitHub Issue reference!"
  echo "Enterprise rules require all commits to link back to a tracked plan/task."
  echo ""
  echo "You MUST include one of the following patterns anywhere in your message:"
  echo "  Fixes #123"
  echo "  Resolves #123"
  echo "  Updates #123"
  echo "  Closes #123"
  echo "  Refs #123"
  echo ""
  echo "Please edit the commit message and try again."
  exit 1
fi
exit 0
HOOK_EOF

chmod +x "$COMMIT_MSG_HOOK"

echo "✅ [CEO Git Hook] Installed successfully in $(pwd)/.git/hooks/commit-msg"
echo "All future commits in this repo will be strictly checked for Issue IDs."
