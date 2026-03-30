#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: proactive-codex-loop.sh [options]

Options:
  --project <dir>            Project directory
  --session-id <id>          Session id (optional if in state)
  --interval-sec <n>         Loop interval seconds (default: 90)
  --max-parallel-checks <n>  Max concurrent checks (default: 4)
  --once                     Run one iteration then exit
  --dry-run                  Print intervention message but do not send
  -h, --help                 Show help
USAGE
}

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
resolve_script="${script_dir}/resolve_project_dir.sh"
session_script="${script_dir}/session-state.sh"
send_script="${script_dir}/send-opencode-collab-message.sh"

project_arg=""
session_id=""
interval_sec=90
max_parallel_checks=4
run_once=0
dry_run=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --project)
      [[ $# -ge 2 ]] || { echo "error: --project requires value" >&2; exit 1; }
      project_arg="$2"
      shift 2
      ;;
    --session-id)
      [[ $# -ge 2 ]] || { echo "error: --session-id requires value" >&2; exit 1; }
      session_id="$2"
      shift 2
      ;;
    --interval-sec)
      [[ $# -ge 2 ]] || { echo "error: --interval-sec requires value" >&2; exit 1; }
      interval_sec="$2"
      shift 2
      ;;
    --max-parallel-checks)
      [[ $# -ge 2 ]] || { echo "error: --max-parallel-checks requires value" >&2; exit 1; }
      max_parallel_checks="$2"
      shift 2
      ;;
    --once)
      run_once=1
      shift
      ;;
    --dry-run)
      dry_run=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "error: unknown option '$1'" >&2
      usage
      exit 1
      ;;
  esac
done

project_dir="$(${resolve_script} "${project_arg:-}")"
if [[ -z "$session_id" ]]; then
  session_id="$(${session_script} get --project "$project_dir" --key session_id 2>/dev/null || true)"
fi
[[ -n "$session_id" ]] || { echo "error: session_id missing (argument or state)" >&2; exit 1; }

if ! [[ "$interval_sec" =~ ^[0-9]+$ ]] || [[ "$interval_sec" -lt 5 ]]; then
  echo "error: --interval-sec must be integer >= 5" >&2
  exit 1
fi
if ! [[ "$max_parallel_checks" =~ ^[0-9]+$ ]] || [[ "$max_parallel_checks" -lt 1 ]]; then
  echo "error: --max-parallel-checks must be integer >= 1" >&2
  exit 1
fi

run_checks_once() {
  local tmpdir
  tmpdir="$(mktemp -d)"

  check_git_status() {
    if git -C "$project_dir" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
      git -C "$project_dir" status --short >"$tmpdir/git_status.txt" || true
      git -C "$project_dir" diff --name-only >"$tmpdir/git_diff_names.txt" || true
    else
      : >"$tmpdir/git_status.txt"
      : >"$tmpdir/git_diff_names.txt"
    fi
  }

  check_lock_age() {
    lock_path="$project_dir/.pipeline.lock"
    if [[ -f "$lock_path" ]]; then
      now="$(date +%s)"
      mtime="$(stat -f %m "$lock_path" 2>/dev/null || echo 0)"
      age=$((now - mtime))
      echo "$age" >"$tmpdir/lock_age_sec.txt"
    else
      echo "-1" >"$tmpdir/lock_age_sec.txt"
    fi
  }

  check_recent_errors() {
    rg -n "run_error|api_error|timeout|failed" "$project_dir/logs" -S --glob "*.jsonl" --glob "*.log" 2>/dev/null | tail -n 30 >"$tmpdir/recent_errors.txt" || true
  }

  check_conflicts() {
    rg -n "^(<<<<<<<|=======|>>>>>>>)" "$project_dir" -S --glob '!node_modules/**' --glob '!.git/**' --glob '!.opencode-context/**' >"$tmpdir/conflicts.txt" 2>/dev/null || true
  }

  check_canonical_drift() {
    rg -n "^(AGENTS-PLAN\.md|ARCHITECTURE\.md|README\.md|OPENCODE\.md|docs/OPENCODE\.md|docs/guides/MIGRATION_V3\.md|docs/guides/OPERATOR_RUNBOOK_V3\.md|rules/global/.*\.md|docs/specs/index\.json|docs/api/openapi-v3-controlplane\.yaml)$" "$tmpdir/git_diff_names.txt" >"$tmpdir/canonical_drift.txt" 2>/dev/null || true
  }

  check_contract_drift() {
    rg -n "^(docs/specs/index\.json|docs/api/openapi-v3-controlplane\.yaml)$" "$tmpdir/git_diff_names.txt" >"$tmpdir/contract_drift.txt" 2>/dev/null || true
  }

  check_rule_conflicts() {
    {
      rg -n "^(<<<<<<<|=======|>>>>>>>)" "$project_dir/rules" -S --glob "*.md" 2>/dev/null || true
      rg -n "override.*rule|except.*mandate|legacy.*v2" "$project_dir/rules" -S --glob "*.md" 2>/dev/null || true
    } >"$tmpdir/rule_conflict_signals.txt"
  }

  if [[ "$max_parallel_checks" -le 1 ]]; then
    check_git_status
    check_lock_age
    check_recent_errors
    check_conflicts
    check_canonical_drift
    check_contract_drift
    check_rule_conflicts
  else
    run_parallel_checks() {
      local -a funcs=(check_git_status check_lock_age check_recent_errors check_conflicts check_canonical_drift check_contract_drift check_rule_conflicts)
      local -a pids=()
      local running=0
      local fn
      wait_all_pids() {
        local wpid
        for wpid in ${pids[@]+"${pids[@]}"}; do
          wait "$wpid"
        done
      }
      for fn in "${funcs[@]}"; do
        "$fn" &
        pids+=("$!")
        running=$((running + 1))
        if [[ "$running" -ge "$max_parallel_checks" ]]; then
          wait_all_pids
          pids=()
          running=0
        fi
      done
      wait_all_pids
    }

    run_parallel_checks
  fi

  local reason_lines=()

  local changes
  changes="$(wc -l < "$tmpdir/git_status.txt" | tr -d ' ')"
  reason_lines+=("- git_changes: ${changes}")

  local lock_age
  lock_age="$(cat "$tmpdir/lock_age_sec.txt")"
  if [[ "$lock_age" -ge 0 ]]; then
    reason_lines+=("- pipeline_lock_age_sec: ${lock_age}")
    if [[ "$lock_age" -gt 1800 ]]; then
      reason_lines+=("- risk: stale pipeline lock detected")
    fi
  else
    reason_lines+=("- pipeline_lock: not present")
  fi

  local err_count
  err_count="$(wc -l < "$tmpdir/recent_errors.txt" | tr -d ' ')"
  if [[ "$err_count" -gt 0 ]]; then
    reason_lines+=("- recent_error_signals: ${err_count}")
  else
    reason_lines+=("- recent_error_signals: 0")
  fi

  local conflict_count
  conflict_count="$(wc -l < "$tmpdir/conflicts.txt" | tr -d ' ')"
  if [[ "$conflict_count" -gt 0 ]]; then
    reason_lines+=("- risk: merge_conflicts_detected=${conflict_count}")
  else
    reason_lines+=("- merge_conflicts: 0")
  fi

  local canonical_drift_count
  canonical_drift_count="$(wc -l < "$tmpdir/canonical_drift.txt" | tr -d ' ')"
  reason_lines+=("- canonical_doc_drift: ${canonical_drift_count}")
  if [[ "$canonical_drift_count" -gt 0 ]]; then
    reason_lines+=("- trigger: canonical_doc_change_detected")
  fi

  local contract_drift_count
  contract_drift_count="$(wc -l < "$tmpdir/contract_drift.txt" | tr -d ' ')"
  reason_lines+=("- contract_openapi_drift: ${contract_drift_count}")
  if [[ "$contract_drift_count" -gt 0 ]]; then
    reason_lines+=("- trigger: contract_openapi_change_detected")
  fi

  local rule_conflict_count
  rule_conflict_count="$(wc -l < "$tmpdir/rule_conflict_signals.txt" | tr -d ' ')"
  reason_lines+=("- rule_conflict_signals: ${rule_conflict_count}")
  if [[ "$rule_conflict_count" -gt 0 ]]; then
    reason_lines+=("- trigger: rule_conflict_signal_detected")
  fi

  local msg_file
  msg_file="$tmpdir/proactive_message.txt"
  {
    echo "Codex proactive intervention checkpoint (maximal mode)."
    echo
    echo "Observed signals:"
    printf '%s\n' "${reason_lines[@]}"
    echo
    echo "Action request:"
    echo "1. Update shared plan status with owner labels (Codex|Opencode|Joint)."
    echo "2. Reprioritize next 3 steps based on canonical/risk signals."
    echo "3. If blocker exists, propose mitigation and continue on safest path."
    echo "4. Include canonical_sources_used + conflicts_resolved_with_priority in response."
  } >"$msg_file"

  if [[ "$dry_run" -eq 1 ]]; then
    cat "$msg_file"
  else
    "${send_script}" \
      --project "$project_dir" \
      --session-id "$session_id" \
      --with-delta true \
      --message-file "$msg_file"
  fi

  rm -rf "$tmpdir"
}

while true; do
  run_checks_once
  if [[ "$run_once" -eq 1 ]]; then
    break
  fi
  sleep "$interval_sec"
done
