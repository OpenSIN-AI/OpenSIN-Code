#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
resolve_script="${script_dir}/resolve_project_dir.sh"
session_script="${script_dir}/session-state.sh"
start_script="${script_dir}/start-opencode-collab.sh"
send_script="${script_dir}/send-opencode-collab-message.sh"

usage() {
  cat <<'USAGE'
Usage: run-opencode-delegated.sh [options] -- <task message>

Options:
  --project <dir>   Project directory
  --agent <name>    Agent used when creating a missing session
  --model <model>   Model used when creating a missing session
  --title <text>    Title used when creating a missing session
  --with-delta <v>  Delta mode for send step (default: true)
  --max-runtime-sec <n>  Hard runtime cap per opencode run
  --max-tool-calls <n>   Hard tool-call cap per opencode run

Behavior:
- Reuse persistent collaboration session if available.
- If missing, start-opencode-collab.sh is executed first.
- Message is sent via send-opencode-collab-message.sh.
USAGE
}

project_arg=""
agent_arg=""
model_arg=""
title_arg=""
with_delta="true"
max_runtime_sec=""
max_tool_calls=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --project)
      [[ $# -ge 2 ]] || { echo "error: --project requires value" >&2; exit 1; }
      project_arg="$2"
      shift 2
      ;;
    --agent)
      [[ $# -ge 2 ]] || { echo "error: --agent requires value" >&2; exit 1; }
      agent_arg="$2"
      shift 2
      ;;
    --model)
      [[ $# -ge 2 ]] || { echo "error: --model requires value" >&2; exit 1; }
      model_arg="$2"
      shift 2
      ;;
    --title)
      [[ $# -ge 2 ]] || { echo "error: --title requires value" >&2; exit 1; }
      title_arg="$2"
      shift 2
      ;;
    --with-delta)
      [[ $# -ge 2 ]] || { echo "error: --with-delta requires value" >&2; exit 1; }
      with_delta="$2"
      shift 2
      ;;
    --max-runtime-sec)
      [[ $# -ge 2 ]] || { echo "error: --max-runtime-sec requires value" >&2; exit 1; }
      max_runtime_sec="$2"
      shift 2
      ;;
    --max-tool-calls)
      [[ $# -ge 2 ]] || { echo "error: --max-tool-calls requires value" >&2; exit 1; }
      max_tool_calls="$2"
      shift 2
      ;;
    --)
      shift
      break
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

[[ $# -gt 0 ]] || { echo "error: missing task message" >&2; usage; exit 1; }

project_dir="$(${resolve_script} "${project_arg:-}")"
message="$*"

session_id="$(${session_script} get --project "$project_dir" --key session_id 2>/dev/null || true)"
if [[ -z "$session_id" ]]; then
  start_cmd=("${start_script}" --project "$project_dir")
  if [[ -n "$agent_arg" ]]; then
    start_cmd+=(--agent "$agent_arg")
  fi
  if [[ -n "$model_arg" ]]; then
    start_cmd+=(--model "$model_arg")
  fi
  if [[ -n "$title_arg" ]]; then
    start_cmd+=(--title "$title_arg")
  fi
  if [[ -n "$max_runtime_sec" ]]; then
    start_cmd+=(--max-runtime-sec "$max_runtime_sec")
  fi
  if [[ -n "$max_tool_calls" ]]; then
    start_cmd+=(--max-tool-calls "$max_tool_calls")
  fi
  "${start_cmd[@]}" >/dev/null
  session_id="$(${session_script} get --project "$project_dir" --key session_id)"
fi

send_cmd=(
  "${send_script}"
  --project "$project_dir"
  --session-id "$session_id"
  --with-delta "$with_delta"
  --message "$message"
)
if [[ -n "$max_runtime_sec" ]]; then
  send_cmd+=(--max-runtime-sec "$max_runtime_sec")
fi
if [[ -n "$max_tool_calls" ]]; then
  send_cmd+=(--max-tool-calls "$max_tool_calls")
fi
"${send_cmd[@]}"
