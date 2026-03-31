#!/usr/bin/env bash
set -e

# ==========================================
# SIN-GITHUB-CEO - 2026 Enterprise Issue Tracker
# ==========================================
# Creates structured Epics/Issues based on a plan file.
# Usage: ~/.config/opencode/scripts/sin-github-ceo.sh <plan.md> [optional: title override]

if [ -z "$1" ]; then
  echo "Error: Plan file required."
  echo "Usage: sin-github-ceo.sh <plan.md> [title override]"
  exit 1
fi

PLAN_FILE="$1"
TITLE="${2:-"🚀 [EPIC] Agent Plan Execution"}"

if [ ! -f "$PLAN_FILE" ]; then
  echo "Error: File $PLAN_FILE not found."
  exit 1
fi

if ! command -v gh &> /dev/null; then
  echo "Error: GitHub CLI (gh) not found."
  exit 1
fi

echo "👑 KING CEO MODE: Initializing Project Board..."

# 1. Create Master Issue
echo "-> Creating Master Epic Issue..."
ISSUE_URL=$(gh issue create --title "$TITLE" --body-file "$PLAN_FILE")

if [ -z "$ISSUE_URL" ]; then
  echo "❌ Failed to create Master Issue."
  exit 1
fi

ISSUE_ID=$(echo "$ISSUE_URL" | awk -F/ '{print $NF}')
echo "✅ Master Epic Created: $ISSUE_URL (#$ISSUE_ID)"

# 2. Parse Phases and create Sub-Issues
# We look for lines starting with "### Phase"
PHASES=$(grep -E "^### Phase" "$PLAN_FILE" || true)

if [ -n "$PHASES" ]; then
  echo "-> Detected Phases. Creating Sub-Tasks..."
  
  COMMENT_BODY="### 📋 Sub-Task Tracker\n"
  
  while IFS= read -r line; do
    # Clean the phase name
    PHASE_NAME=$(echo "$line" | sed 's/^### Phase [0-9]*: //')
    PHASE_NAME=$(echo "$PHASE_NAME" | sed 's/--.*//' | xargs) # Remove -- CRITICAL etc and trim
    
    SUB_TITLE="🎯 [TASK] $PHASE_NAME (Epic: #$ISSUE_ID)"
    SUB_BODY="This is a child task of Epic #$ISSUE_ID.\n\n**Phase Details:**\n$PHASE_NAME\n\nPlease close this issue when the phase is fully verified."
    
    SUB_URL=$(gh issue create --title "$SUB_TITLE" --body "$SUB_BODY")
    SUB_ID=$(echo "$SUB_URL" | awk -F/ '{print $NF}')
    
    echo "  ✅ Created Sub-Task: $SUB_URL"
    COMMENT_BODY="$COMMENT_BODY- [ ] #$SUB_ID : $PHASE_NAME\n"
    
  done <<< "$PHASES"
  
  # Add the checklist comment to the Master Epic
  echo -e "$COMMENT_BODY" > /tmp/epic_comment.md
  gh issue comment "$ISSUE_ID" --body-file /tmp/epic_comment.md
  echo "✅ Linked Sub-Tasks to Master Epic."
fi

echo "=========================================="
echo "🎉 KING CEO INITIALIZATION COMPLETE"
echo "Master Epic: $ISSUE_URL"
echo "You MUST include 'Fixes #$ISSUE_ID' (or the Sub-Task ID) in all commits!"
echo "=========================================="
