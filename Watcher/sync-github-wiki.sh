#!/usr/bin/env bash
set -e

# ==========================================
# GITHUB WIKI SYNC (2026 Enterprise)
# ==========================================
# Clones the repo wiki, updates it with the plan/architecture, and pushes.
# Usage: ./sync-github-wiki.sh <plan.md> [PageName]

if [ -z "$1" ]; then
  echo "Error: Markdown file required."
  echo "Usage: sync-github-wiki.sh <plan.md> [PageName]"
  exit 1
fi

PLAN_FILE="$1"
PAGE_NAME="${2:-"Architecture-and-Plans"}"

if [ ! -f "$PLAN_FILE" ]; then
  echo "Error: File $PLAN_FILE not found."
  exit 1
fi

if ! command -v gh &> /dev/null; then
  echo "Error: GitHub CLI (gh) not found."
  exit 1
fi

# Get repo name (e.g., Delqhi/opendocs)
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
if [ -z "$REPO" ]; then
  echo "Error: Not in a GitHub repository or gh not authenticated."
  exit 1
fi

WIKI_URL="git@github.com:${REPO}.wiki.git"
WIKI_DIR=".opencode-wiki"

echo "👑 KING CEO MODE: Syncing to GitHub Wiki ($WIKI_URL)..."

# Clean up any stale directory
rm -rf "$WIKI_DIR"

# Check if the wiki git repository is initialized
if ! git ls-remote "$WIKI_URL" &> /dev/null; then
  echo ""
  echo "🚨 [WIKI NOT INITIALIZED] 🚨"
  echo "The GitHub Wiki for $REPO does not exist yet!"
  echo "GitHub requires the first Wiki page to be created via the Web UI before the git repo becomes available."
  echo ""
  echo "👉 INSTRUCTION FOR AGENT:"
  echo "Use the 'webauto-nodriver_goto' tool to navigate to: https://github.com/${REPO}/wiki/_new"
  echo "Use 'webauto-nodriver_type_text' to fill in the first page."
  echo "Use 'webauto-nodriver_click' to click the 'Save page' button."
  echo "After doing this, run this script again!"
  exit 2
fi

echo "-> Wiki exists. Cloning..."
git clone "$WIKI_URL" "$WIKI_DIR"

echo "-> Copying plan to Wiki page: ${PAGE_NAME}.md"
cp "$PLAN_FILE" "$WIKI_DIR/${PAGE_NAME}.md"

cd "$WIKI_DIR"
git add "${PAGE_NAME}.md"

# Only commit if there are changes
if git diff --staged --quiet; then
  echo "-> No changes detected in the plan. Wiki is up to date."
else
  git commit -m "docs(wiki): sync plan and architecture for $PAGE_NAME"
  git push origin HEAD
  echo "✅ Wiki Page Updated Successfully!"
fi

cd ..
rm -rf "$WIKI_DIR"
echo "=========================================="
echo "🎉 KING CEO WIKI SYNC COMPLETE"
echo "Link: https://github.com/${REPO}/wiki"
echo "=========================================="
