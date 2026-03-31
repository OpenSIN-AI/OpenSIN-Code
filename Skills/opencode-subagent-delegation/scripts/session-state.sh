#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: session-state.sh <command> [options]

Commands:
  path                        print default state path
  show                        print JSON state ({} if missing)
  get --key <name>            print value for key
  set [fields...]             update state fields
  clear                       remove state file

Common options:
  --project <dir>             project directory (default: git root or PWD)
  --state-file <path>         explicit state file path

Set options:
  --session-id <id>
  --bundle-id <id>
  --bundle-dir <dir>
  --manifest-path <path>
  --last-delta-dir <dir>
  --proactive-mode <mode>
  --critical-mode <mode>
  --context-ready <true|false>
  --mutual-critique-ready <true|false>
  --mutual-plan-ready <true|false>
  --last-message-at <iso>
USAGE
}

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
resolve_script="${script_dir}/resolve_project_dir.sh"

if [[ $# -ge 1 && ( "$1" == "-h" || "$1" == "--help" ) ]]; then
  usage
  exit 0
fi

[[ $# -ge 1 ]] || { usage; exit 1; }
command_name="$1"
shift

project_arg=""
state_file=""

# Generic parsed fields for set
session_id=""
bundle_id=""
bundle_dir=""
manifest_path=""
last_delta_dir=""
proactive_mode=""
critical_mode=""
context_ready=""
mutual_critique_ready=""
mutual_plan_ready=""
last_message_at=""
get_key=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --project)
      [[ $# -ge 2 ]] || { echo "error: --project requires value" >&2; exit 1; }
      project_arg="$2"
      shift 2
      ;;
    --state-file)
      [[ $# -ge 2 ]] || { echo "error: --state-file requires value" >&2; exit 1; }
      state_file="$2"
      shift 2
      ;;
    --session-id)
      [[ $# -ge 2 ]] || { echo "error: --session-id requires value" >&2; exit 1; }
      session_id="$2"
      shift 2
      ;;
    --bundle-id)
      [[ $# -ge 2 ]] || { echo "error: --bundle-id requires value" >&2; exit 1; }
      bundle_id="$2"
      shift 2
      ;;
    --bundle-dir)
      [[ $# -ge 2 ]] || { echo "error: --bundle-dir requires value" >&2; exit 1; }
      bundle_dir="$2"
      shift 2
      ;;
    --manifest-path)
      [[ $# -ge 2 ]] || { echo "error: --manifest-path requires value" >&2; exit 1; }
      manifest_path="$2"
      shift 2
      ;;
    --last-delta-dir)
      [[ $# -ge 2 ]] || { echo "error: --last-delta-dir requires value" >&2; exit 1; }
      last_delta_dir="$2"
      shift 2
      ;;
    --proactive-mode)
      [[ $# -ge 2 ]] || { echo "error: --proactive-mode requires value" >&2; exit 1; }
      proactive_mode="$2"
      shift 2
      ;;
    --critical-mode)
      [[ $# -ge 2 ]] || { echo "error: --critical-mode requires value" >&2; exit 1; }
      critical_mode="$2"
      shift 2
      ;;
    --context-ready)
      [[ $# -ge 2 ]] || { echo "error: --context-ready requires value" >&2; exit 1; }
      context_ready="$2"
      shift 2
      ;;
    --mutual-critique-ready)
      [[ $# -ge 2 ]] || { echo "error: --mutual-critique-ready requires value" >&2; exit 1; }
      mutual_critique_ready="$2"
      shift 2
      ;;
    --mutual-plan-ready)
      [[ $# -ge 2 ]] || { echo "error: --mutual-plan-ready requires value" >&2; exit 1; }
      mutual_plan_ready="$2"
      shift 2
      ;;
    --last-message-at)
      [[ $# -ge 2 ]] || { echo "error: --last-message-at requires value" >&2; exit 1; }
      last_message_at="$2"
      shift 2
      ;;
    --key)
      [[ $# -ge 2 ]] || { echo "error: --key requires value" >&2; exit 1; }
      get_key="$2"
      shift 2
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
if [[ -z "$state_file" ]]; then
  state_file="${project_dir}/.opencode-context/session/state.json"
fi

case "$command_name" in
  path)
    echo "$state_file"
    ;;
  show)
    python3 - "$state_file" <<'PY'
import json
import sys
from pathlib import Path

p = Path(sys.argv[1])
if not p.exists():
    print("{}")
else:
    print(json.dumps(json.loads(p.read_text(encoding="utf-8")), ensure_ascii=False))
PY
    ;;
  get)
    [[ -n "$get_key" ]] || { echo "error: --key is required for get" >&2; exit 1; }
    python3 - "$state_file" "$get_key" <<'PY'
import json
import sys
from pathlib import Path

p = Path(sys.argv[1])
key = sys.argv[2]
if not p.exists():
    raise SystemExit(1)
obj = json.loads(p.read_text(encoding="utf-8"))
val = obj
for part in key.split('.'):
    if isinstance(val, dict) and part in val:
        val = val[part]
    else:
        raise SystemExit(1)
if isinstance(val, (dict, list)):
    print(json.dumps(val, ensure_ascii=False))
else:
    print(val)
PY
    ;;
  clear)
    rm -f "$state_file"
    ;;
  set)
    python3 - "$state_file" "$project_dir" "$session_id" "$bundle_id" "$bundle_dir" "$manifest_path" "$last_delta_dir" "$proactive_mode" "$critical_mode" "$context_ready" "$mutual_critique_ready" "$mutual_plan_ready" "$last_message_at" <<'PY'
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

state_file = Path(sys.argv[1])
project_dir = Path(sys.argv[2]).resolve()
session_id = sys.argv[3]
bundle_id = sys.argv[4]
bundle_dir = sys.argv[5]
manifest_path = sys.argv[6]
last_delta_dir = sys.argv[7]
proactive_mode = sys.argv[8]
critical_mode = sys.argv[9]
context_ready = sys.argv[10]
mutual_critique_ready = sys.argv[11]
mutual_plan_ready = sys.argv[12]
last_message_at = sys.argv[13]

state_file.parent.mkdir(parents=True, exist_ok=True)
if state_file.exists():
    try:
        state = json.loads(state_file.read_text(encoding="utf-8"))
    except Exception:
        state = {}
else:
    state = {}

state["project_dir"] = str(project_dir)
state["state_path"] = str(state_file)
state["updated_at"] = datetime.now(timezone.utc).isoformat()

if session_id:
    state["session_id"] = session_id
if bundle_id:
    state["bundle_id"] = bundle_id
if bundle_dir:
    state["bundle_dir"] = bundle_dir
if manifest_path:
    state["manifest_path"] = manifest_path
if last_delta_dir:
    state["last_delta_dir"] = last_delta_dir
if proactive_mode:
    state["proactive_mode"] = proactive_mode
if critical_mode:
    state["critical_mode"] = critical_mode
if context_ready:
    state["context_ready"] = context_ready.lower() in ("1", "true", "yes", "on")
if mutual_critique_ready:
    state["mutual_critique_ready"] = mutual_critique_ready.lower() in ("1", "true", "yes", "on")
if mutual_plan_ready:
    state["mutual_plan_ready"] = mutual_plan_ready.lower() in ("1", "true", "yes", "on")
if last_message_at:
    state["last_message_at"] = last_message_at

state_file.write_text(json.dumps(state, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
print(json.dumps(state, ensure_ascii=False))
PY
    ;;
  *)
    echo "error: unknown command '$command_name'" >&2
    usage
    exit 1
    ;;
esac
