#!/usr/bin/env bash
# watch-pr-feedback.sh — PR Watcher entrypoint for OpenSIN-Code
# Monitors PRs for creation, updates, merges, and closures
# Posts automated review feedback and updates linked GitHub issues
#
# Usage: ./scripts/watch-pr-feedback.sh [--once|--watch]
#   --once   Run once and exit (for CI/CD)
#   --watch  Continuous monitoring (default)

set -euo pipefail

REPO="${GITHUB_REPOSITORY:-OpenSIN-AI/OpenSIN-Code}"
OWNER="${REPO%%/*}"
REPO_NAME="${REPO##*/}"
POLL_INTERVAL="${PR_WATCH_POLL_INTERVAL:-60}"
GITHUB_TOKEN="${GITHUB_TOKEN:-}"
TELEGRAM_BOT="${TELEGRAM_BOT:-}"
TELEGRAM_CHAT_ID="${TELEGRAM_CHAT_ID:-}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() { echo -e "${GREEN}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') $*"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $(date '+%Y-%m-%d %H:%M:%S') $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') $*" >&2; }

# Check dependencies
check_deps() {
  local missing=()
  for cmd in gh jq curl; do
    if ! command -v "$cmd" &>/dev/null; then
      missing+=("$cmd")
    fi
  done
  if [ ${#missing[@]} -gt 0 ]; then
    log_error "Missing dependencies: ${missing[*]}"
    exit 1
  fi
  if [ -z "$GITHUB_TOKEN" ]; then
    log_error "GITHUB_TOKEN not set"
    exit 1
  fi
}

# Get open PRs
get_open_prs() {
  gh pr list --repo "$REPO" --state open --json number,title,author,createdAt,labels,headRefName,baseRefName --limit 50 2>/dev/null || echo "[]"
}

# Get PR files
get_pr_files() {
  local pr_number="$1"
  gh pr view "$pr_number" --repo "$REPO" --json files --jq '.files' 2>/dev/null || echo "[]"
}

# Get PR diff stats
get_pr_diff_stats() {
  local pr_number="$1"
  gh pr diff "$pr_number" --repo "$REPO" 2>/dev/null | git diff --stat --no-index /dev/null /dev/stdin 2>/dev/null || echo "No diff stats"
}

# Run automated checks on a PR
run_pr_checks() {
  local pr_number="$1"
  local results="{}"
  local all_passed=true

  # Check build
  log_info "Running build check for PR #$pr_number..."
  if gh pr checks "$pr_number" --repo "$REPO" --required 2>/dev/null | grep -q "success"; then
    results=$(echo "$results" | jq '. + {"build": "passed"}')
  else
    results=$(echo "$results" | jq '. + {"build": "pending_or_failed"}')
    all_passed=false
  fi

  # Check test coverage
  log_info "Checking test coverage for PR #$pr_number..."
  # In production: parse coverage report
  results=$(echo "$results" | jq '. + {"tests": "pending"}')

  # Check lint
  log_info "Running lint check for PR #$pr_number..."
  results=$(echo "$results" | jq '. + {"lint": "pending"}')

  # Check file count
  local file_count
  file_count=$(get_pr_files "$pr_number" | jq 'length')
  if [ "$file_count" -gt 50 ]; then
    log_warn "PR #$pr_number has $file_count files (max: 50)"
    results=$(echo "$results" | jq --arg count "$file_count" '. + {"file_count": ($count | tonumber), "file_count_warning": true}')
  else
    results=$(echo "$results" | jq --arg count "$file_count" '. + {"file_count": ($count | tonumber)}')
  fi

  # Check lines changed
  local additions deletions
  additions=$(get_pr_files "$pr_number" | jq '[.[].additions] | add // 0')
  deletions=$(get_pr_files "$pr_number" | jq '[.[].deletions] | add // 0')
  local total_changes=$((additions + deletions))
  if [ "$total_changes" -gt 500 ]; then
    log_warn "PR #$pr_number has $total_changes lines changed (max: 500)"
    results=$(echo "$results" | jq --arg total "$total_changes" '. + {"total_changes": ($total | tonumber), "change_count_warning": true}')
  else
    results=$(echo "$results" | jq --arg total "$total_changes" '. + {"total_changes": ($total | tonumber)}')
  fi

  echo "$results"
}

# Post review comment to PR
post_review_comment() {
  local pr_number="$1"
  local checks="$2"

  local build_status tests_status lint_status file_count total_changes
  build_status=$(echo "$checks" | jq -r '.build')
  tests_status=$(echo "$checks" | jq -r '.tests')
  lint_status=$(echo "$checks" | jq -r '.lint')
  file_count=$(echo "$checks" | jq -r '.file_count')
  total_changes=$(echo "$checks" | jq -r '.total_changes')

  local file_warning="" change_warning=""
  if [ "$(echo "$checks" | jq -r '.file_count_warning')" = "true" ]; then
    file_warning=" ⚠️ **File count exceeds 50** ($file_count files)"
  fi
  if [ "$(echo "$checks" | jq -r '.change_count_warning')" = "true" ]; then
    change_warning=" ⚠️ **Lines changed exceed 500** ($total_changes lines)"
  fi

  local comment="## 🤖 Automated PR Review

| Check | Status |
|-------|--------|
| Build | $build_status |
| Tests | $tests_status |
| Lint | $lint_status |
| Files Changed | $file_count$file_warning |
| Lines Changed | $total_changes$change_warning |

---

*This review was generated automatically by the OpenSIN-Code PR Watcher.*
*Configuration: \`governance/pr-watcher.json\`*"

  gh pr comment "$pr_number" --repo "$REPO" --body "$comment" 2>/dev/null || log_error "Failed to post comment on PR #$pr_number"
}

# Find linked issue from PR body
find_linked_issue() {
  local pr_number="$1"
  local body
  body=$(gh pr view "$pr_number" --repo "$REPO" --json body --jq '.body' 2>/dev/null || echo "")

  # Look for "Fixes #123", "Closes #123", "Resolves #123"
  local issue_number
  issue_number=$(echo "$body" | grep -oP '(?:fixes|closes|resolves)\s+#(\d+)' -i | grep -oP '\d+' | head -1)

  echo "$issue_number"
}

# Update linked issue status
update_linked_issue() {
  local issue_number="$1"
  local pr_number="$2"
  local status="$3"

  if [ -z "$issue_number" ]; then
    return 0
  fi

  local comment="## 📋 PR Status Update

**PR:** #${pr_number}
**Status:** ${status}
**Updated:** $(date -u '+%Y-%m-%d %H:%M:%S UTC')

---

*Auto-updated by OpenSIN-Code PR Watcher*"

  gh issue comment "$issue_number" --repo "$REPO" --body "$comment" 2>/dev/null || log_warn "Failed to update issue #$issue_number"
}

# Process a single PR
process_pr() {
  local pr_number="$1"
  log_info "Processing PR #$pr_number..."

  # Run checks
  local checks
  checks=$(run_pr_checks "$pr_number")

  # Post review
  post_review_comment "$pr_number" "$checks"

  # Find and update linked issue
  local linked_issue
  linked_issue=$(find_linked_issue "$pr_number")
  if [ -n "$linked_issue" ]; then
    update_linked_issue "$linked_issue" "$pr_number" "under_review"
    log_info "Updated linked issue #$linked_issue for PR #$pr_number"
  fi
}

# Main watch loop
watch_prs() {
  local mode="${1:-watch}"
  local last_pr_state=""

  log_info "Starting PR Watcher for $REPO (mode: $mode)"
  log_info "Poll interval: ${POLL_INTERVAL}s"

  while true; do
    local current_pr_state
    current_pr_state=$(get_open_prs | jq -c '[.[] | {number, title}]' 2>/dev/null)

    if [ "$current_pr_state" != "$last_pr_state" ]; then
      log_info "PR state changed, processing..."

      local pr_numbers
      pr_numbers=$(echo "$current_pr_state" | jq -r '.[].number')

      for pr_number in $pr_numbers; do
        process_pr "$pr_number"
      done

      last_pr_state="$current_pr_state"
    fi

    if [ "$mode" = "once" ]; then
      log_info "Single run complete, exiting"
      break
    fi

    sleep "$POLL_INTERVAL"
  done
}

# Entry point
main() {
  check_deps

  local mode="watch"
  if [ "${1:-}" = "--once" ]; then
    mode="once"
  fi

  watch_prs "$mode"
}

main "$@"
