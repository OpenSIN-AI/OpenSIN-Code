#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: send-opencode-collab-message.sh [options]

Options:
  --project <dir>         Project directory
  --session-id <id>       Session id (optional if in state)
  --state-file <path>     Explicit state file
  --message <text>        Message content
  --message-file <path>   Message content file
  --with-delta <bool>     Build/attach delta (default: true)
  --agent <name>          Optional agent override
  --model <provider/model> Optional model override
  --max-runtime-sec <n>   Hard runtime cap per opencode run (default: 420)
  --max-tool-calls <n>    Hard tool-call cap per opencode run (default: 16)
  -h, --help              Show help

Model selection:
- Ordered fallback chain via `OPENCODE_MODEL_FALLBACK_CHAIN`, or default
  `OPENCODE_PRIMARY_MODEL` -> `OPENCODE_FALLBACK_MODEL` -> `OPENCODE_TERTIARY_FALLBACK_MODEL` (`OPENCODE_NIM_FALLBACK_MODEL` alias).
- Uses `OPENCODE_BIN` when set, otherwise resolves `opencode` from PATH.
USAGE
}

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
resolve_script="${script_dir}/resolve_project_dir.sh"
session_script="${script_dir}/session-state.sh"
delta_script="${script_dir}/build-context-delta.sh"
coverage_script="${script_dir}/context-coverage-check.sh"

lower() {
  printf '%s' "$1" | tr '[:upper:]' '[:lower:]'
}

trim_ws() {
  local s="$1"
  s="${s#"${s%%[![:space:]]*}"}"
  s="${s%"${s##*[![:space:]]}"}"
  printf '%s' "$s"
}

model_fallbacks_enabled() {
  local v
  v="$(lower "${1:-1}")"
  [[ "$v" == "1" || "$v" == "true" || "$v" == "yes" || "$v" == "on" ]]
}

append_model_unique() {
  local raw="$1"
  local model
  model="$(trim_ws "$raw")"
  [[ -n "$model" ]] || return 0
  local existing
  for existing in "${models_to_try[@]-}"; do
    if [[ "$existing" == "$model" ]]; then
      return 0
    fi
  done
  models_to_try+=("$model")
}

build_model_chain() {
  models_to_try=()

  local chain_raw="${OPENCODE_MODEL_FALLBACK_CHAIN:-}"
  local primary="${model_arg:-${OPENCODE_PRIMARY_MODEL:-google/gemini-3.1-pro-preview}}"
  local fallback="${OPENCODE_FALLBACK_MODEL:-google/gemini-3-flash-preview}"
  local tertiary="${OPENCODE_TERTIARY_FALLBACK_MODEL:-${OPENCODE_NIM_FALLBACK_MODEL:-nvidia-nim/qwen-3.5-397b}}"
  local fallback_enabled="${OPENCODE_ENABLE_MODEL_FALLBACK:-1}"
  local tertiary_enabled="${OPENCODE_ENABLE_TERTIARY_FALLBACK:-1}"

  if [[ -n "$(trim_ws "$chain_raw")" ]]; then
    if [[ -n "$model_arg" ]]; then
      append_model_unique "$model_arg"
    fi
    local part
    IFS=',' read -r -a chain_parts <<<"$chain_raw"
    for part in "${chain_parts[@]}"; do
      append_model_unique "$part"
    done
  else
    append_model_unique "$primary"
    if model_fallbacks_enabled "$fallback_enabled"; then
      append_model_unique "$fallback"
      if model_fallbacks_enabled "$tertiary_enabled"; then
        append_model_unique "$tertiary"
      fi
    fi
  fi

  if [[ ${#models_to_try[@]} -eq 0 ]]; then
    echo "error: no model candidates configured for opencode run" >&2
    exit 1
  fi
}

resolve_opencode_cmd() {
  local candidate="${OPENCODE_BIN:-opencode}"
  if [[ "$candidate" == */* ]]; then
    [[ -x "$candidate" ]] || { echo "error: opencode binary not executable: $candidate" >&2; exit 127; }
    printf '%s' "$candidate"
    return 0
  fi
  command -v "$candidate" >/dev/null 2>&1 || {
    echo "error: opencode CLI not found in PATH (candidate: $candidate)" >&2
    exit 127
  }
  printf '%s' "$candidate"
}

run_opencode_limited() {
  local out_jsonl="$1"
  local timeout_sec="$2"
  local tool_limit="$3"
  shift 3
  python3 - "$timeout_sec" "$tool_limit" "$out_jsonl" "$@" <<'PY'
import json
import queue
import subprocess
import sys
import threading
import time

timeout_sec = int(sys.argv[1])
tool_limit = int(sys.argv[2])
out_path = sys.argv[3]
cmd = sys.argv[4:]

proc = subprocess.Popen(
    cmd,
    stdout=subprocess.PIPE,
    stderr=subprocess.STDOUT,
    text=True,
    bufsize=1,
)

line_queue = queue.Queue()

def pump_stdout():
    if proc.stdout is None:
        line_queue.put(None)
        return
    try:
        for line in proc.stdout:
            line_queue.put(line)
    finally:
        line_queue.put(None)

threading.Thread(target=pump_stdout, daemon=True).start()

tool_calls = 0
start = time.monotonic()

with open(out_path, "w", encoding="utf-8") as out:
    while True:
        if timeout_sec > 0 and (time.monotonic() - start) > timeout_sec:
            proc.kill()
            proc.wait()
            print(f"error: opencode runtime limit exceeded ({timeout_sec}s)", file=sys.stderr)
            sys.exit(124)

        try:
            line = line_queue.get(timeout=0.1)
        except queue.Empty:
            if proc.poll() is not None:
                break
            continue

        if line is None:
            if proc.poll() is not None:
                break
            continue

        if line:
            sys.stdout.write(line)
            sys.stdout.flush()
            out.write(line)
            out.flush()

            stripped = line.strip()
            if stripped.startswith("{"):
                try:
                    obj = json.loads(stripped)
                except Exception:
                    obj = {}
                if obj.get("type") == "tool_use":
                    tool_calls += 1
                    if tool_limit > 0 and tool_calls > tool_limit:
                        proc.kill()
                        proc.wait()
                        print(
                            f"error: opencode tool-call limit exceeded ({tool_calls}>{tool_limit})",
                            file=sys.stderr,
                        )
                        sys.exit(125)

sys.exit(proc.wait())
PY
}

has_opencode_error_events() {
  local out_jsonl="$1"
  python3 - "$out_jsonl" <<'PY'
import json
import sys
from pathlib import Path

p = Path(sys.argv[1])
has_error = False
for raw in p.read_text(encoding="utf-8", errors="replace").splitlines():
    line = raw.strip()
    if not line.startswith("{"):
        continue
    try:
        obj = json.loads(line)
    except Exception:
        continue
    if obj.get("type") == "error":
        has_error = True
        break

print("1" if has_error else "0")
PY
}

validate_required_response_fields() {
  local out_jsonl="$1"
  shift
  python3 - "$out_jsonl" "$@" <<'PY'
import json
import sys
from pathlib import Path

def collect_assistant_text(p: Path) -> str:
    chunks = []
    for raw in p.read_text(encoding="utf-8", errors="replace").splitlines():
        line = raw.strip()
        if not line.startswith("{"):
            continue
        try:
            obj = json.loads(line)
        except Exception:
            continue
        role = str(obj.get("role", "")).lower()
        typ = str(obj.get("type", "")).lower()
        if role == "user":
            continue
        is_assistantish = role == "assistant" or typ in ("assistant", "message", "response", "final", "output")
        if not is_assistantish:
            continue
        content = obj.get("content", "")
        if isinstance(content, str):
            chunks.append(content)
        elif isinstance(content, list):
            for item in content:
                if isinstance(item, str):
                    chunks.append(item)
                elif isinstance(item, dict):
                    t = item.get("text")
                    if isinstance(t, str):
                        chunks.append(t)

    if chunks:
        return "\n".join(chunks)
    return p.read_text(encoding="utf-8", errors="replace")

text = collect_assistant_text(Path(sys.argv[1])).lower()
fields = [f.strip().lower() for f in sys.argv[2:] if f.strip()]
missing = [f for f in fields if f not in text]
if missing:
    raise SystemExit("missing required response fields: " + ", ".join(missing))
PY
}

project_arg=""
session_id=""
state_file=""
message_text=""
message_file=""
with_delta="true"
agent_arg=""
model_arg=""
max_runtime_sec="${OPENCODE_MAX_RUNTIME_SEC:-420}"
max_tool_calls="${OPENCODE_MAX_TOOL_CALLS:-16}"
opencode_cmd=""
models_to_try=()
required_contract_fields=(
  "prompt_logic_review"
  "objective_refinement"
  "opencode_critique_of_codex"
  "codex_challenge_requested"
  "conflicts_resolved_with_priority"
  "plan_status"
  "work_done"
  "delegated_subtasks"
  "risks_or_blockers"
  "next_steps"
)

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
    --state-file)
      [[ $# -ge 2 ]] || { echo "error: --state-file requires value" >&2; exit 1; }
      state_file="$2"
      shift 2
      ;;
    --message)
      [[ $# -ge 2 ]] || { echo "error: --message requires value" >&2; exit 1; }
      message_text="$2"
      shift 2
      ;;
    --message-file)
      [[ $# -ge 2 ]] || { echo "error: --message-file requires value" >&2; exit 1; }
      message_file="$2"
      shift 2
      ;;
    --with-delta)
      [[ $# -ge 2 ]] || { echo "error: --with-delta requires value" >&2; exit 1; }
      with_delta="$2"
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

[[ "$max_runtime_sec" =~ ^[0-9]+$ ]] || { echo "error: --max-runtime-sec must be integer >= 0" >&2; exit 1; }
[[ "$max_tool_calls" =~ ^[0-9]+$ ]] || { echo "error: --max-tool-calls must be integer >= 0" >&2; exit 1; }

project_dir="$(${resolve_script} "${project_arg:-}")"
opencode_cmd="$(resolve_opencode_cmd)"

if [[ -z "$message_text" && -n "$message_file" ]]; then
  [[ -f "$message_file" ]] || { echo "error: message file not found: $message_file" >&2; exit 1; }
  message_text="$(cat "$message_file")"
fi
[[ -n "$message_text" ]] || { echo "error: message is required" >&2; exit 1; }

if [[ -n "$state_file" ]]; then
  state_json="$(python3 - "$state_file" <<'PY'
import json, sys
from pathlib import Path
p = Path(sys.argv[1])
if not p.exists():
    print("{}")
else:
    print(json.dumps(json.loads(p.read_text(encoding='utf-8')), ensure_ascii=False))
PY
)"
else
  state_json="$(${session_script} show --project "$project_dir")"
fi

if [[ -z "$session_id" ]]; then
  session_id="$(python3 - "$state_json" <<'PY'
import json, sys
print(json.loads(sys.argv[1]).get('session_id', ''))
PY
)"
fi
[[ -n "$session_id" ]] || { echo "error: session_id is required (argument or state)" >&2; exit 1; }

bundle_id="$(python3 - "$state_json" <<'PY'
import json, sys
print(json.loads(sys.argv[1]).get('bundle_id', ''))
PY
)"
bundle_dir="$(python3 - "$state_json" <<'PY'
import json, sys
print(json.loads(sys.argv[1]).get('bundle_dir', ''))
PY
)"
manifest_path="$(python3 - "$state_json" <<'PY'
import json, sys
print(json.loads(sys.argv[1]).get('manifest_path', ''))
PY
)"
context_ready="$(python3 - "$state_json" <<'PY'
import json, sys
v = json.loads(sys.argv[1]).get('context_ready', False)
print("true" if bool(v) else "false")
PY
)"
critical_mode="$(python3 - "$state_json" <<'PY'
import json, sys
print(json.loads(sys.argv[1]).get('critical_mode', ''))
PY
)"
mutual_critique_ready="$(python3 - "$state_json" <<'PY'
import json, sys
v = json.loads(sys.argv[1]).get('mutual_critique_ready', False)
print("true" if bool(v) else "false")
PY
)"
mutual_plan_ready="$(python3 - "$state_json" <<'PY'
import json, sys
v = json.loads(sys.argv[1]).get('mutual_plan_ready', False)
print("true" if bool(v) else "false")
PY
)"

if [[ -z "$bundle_id" || -z "$bundle_dir" || -z "$manifest_path" ]]; then
  echo "error: missing bundle metadata in session state; start-opencode-collab.sh must run first" >&2
  exit 1
fi
if [[ "$(lower "$context_ready")" != "true" ]]; then
  echo "error: context_ready is not true; refusing to send collaborative message" >&2
  exit 1
fi
if [[ "$(lower "$critical_mode")" != "strict" ]]; then
  echo "error: critical_mode is not strict; refusing to continue unsafe collaboration" >&2
  exit 1
fi
if [[ "$(lower "$mutual_critique_ready")" != "true" ]]; then
  echo "error: mutual_critique_ready is not true; restart with start-opencode-collab.sh" >&2
  exit 1
fi
if [[ "$(lower "$mutual_plan_ready")" != "true" ]]; then
  echo "error: mutual_plan_ready is not true; restart with start-opencode-collab.sh" >&2
  exit 1
fi
[[ -d "$bundle_dir" ]] || { echo "error: bundle_dir not found: $bundle_dir" >&2; exit 1; }
[[ -f "$manifest_path" ]] || { echo "error: manifest_path not found: $manifest_path" >&2; exit 1; }

"${coverage_script}" --project "$project_dir" --bundle-dir "$bundle_dir" >/dev/null

profile="$(python3 - "$manifest_path" <<'PY'
import json, sys
print(json.loads(open(sys.argv[1], encoding='utf-8').read()).get('profile', 'generic'))
PY
)"
canonical_index_rel="$(python3 - "$manifest_path" <<'PY'
import json, sys
print(json.loads(open(sys.argv[1], encoding='utf-8').read()).get('canonical_index_path', '04_canonical_stack_index.json'))
PY
)"
canonical_read_order_rel="$(python3 - "$manifest_path" <<'PY'
import json, sys
print(json.loads(open(sys.argv[1], encoding='utf-8').read()).get('canonical_read_order_path', '05_canonical_read_order.md'))
PY
)"

canonical_index_path="${bundle_dir}/${canonical_index_rel}"
canonical_read_order_path="${bundle_dir}/${canonical_read_order_rel}"

[[ -f "$canonical_index_path" ]] || { echo "error: canonical index missing: $canonical_index_path" >&2; exit 1; }
[[ -f "$canonical_read_order_path" ]] || { echo "error: canonical read order missing: $canonical_read_order_path" >&2; exit 1; }

delta_json=""
delta_dir=""
canonical_diff_path=""
with_delta_lc="$(lower "$with_delta")"
if [[ "$with_delta_lc" == "true" || "$with_delta" == "1" || "$with_delta_lc" == "yes" || "$with_delta_lc" == "on" ]]; then
  delta_json="$(${delta_script} --project "$project_dir" --bundle-id "$bundle_id")"
  delta_dir="$(python3 - "$delta_json" <<'PY'
import json, sys
print(json.loads(sys.argv[1]).get('delta_dir', ''))
PY
)"
  canonical_diff_path="${delta_dir}/03_canonical_diff.md"
fi

msg_file="$(mktemp)"
cat > "$msg_file" <<MSG
Codex Intervention Block:
- session_id: ${session_id}
- bundle_id: ${bundle_id}
- profile: ${profile}
- project_dir: ${project_dir}
- context_mode: full-initial + delta-followups
- critical_mode: strict
- canonical_first_policy: true
- required_response_fields: prompt_logic_review, objective_refinement, opencode_critique_of_codex, codex_challenge_requested, conflicts_resolved_with_priority, plan_status, work_done, delegated_subtasks, risks_or_blockers, next_steps
- hard_runtime_limit_sec: ${max_runtime_sec}
- hard_tool_call_limit: ${max_tool_calls}

Context references:
- full_bundle_manifest: ${manifest_path}
- full_bundle_root: ${bundle_dir}
- canonical_stack_index: ${canonical_index_path}
- canonical_read_order: ${canonical_read_order_path}
MSG

if [[ -n "$delta_dir" ]]; then
  cat >> "$msg_file" <<MSG
- delta_manifest: ${delta_dir}/00_delta_manifest.json
- delta_changes: ${delta_dir}/01_changed_files.jsonl
- delta_plan_diff: ${delta_dir}/02_plan_diff.md
MSG
  if [[ -f "$canonical_diff_path" ]]; then
    cat >> "$msg_file" <<MSG
- delta_canonical_diff: ${canonical_diff_path}
MSG
  fi
fi

cat >> "$msg_file" <<MSG

Task / update from Codex:
${message_text}

Protocol:
1. Use canonical sources first, then resolve conflicts by priority.
2. Challenge the request for logic, goal-fit, scope-fit, and hidden risks before implementation changes.
3. Keep challenge loop active in every substantial update: report -> counter-critique -> decision(accept|rework|escalate) -> next action.
4. If uncertainty remains, list missing facts explicitly.
5. Keep session continuity and owner labels (Codex|Opencode|Joint).
MSG

out_jsonl="$(mktemp)"
build_model_chain

run_ok="false"
for model_try in "${models_to_try[@]}"; do
  cmd=("$opencode_cmd" run --format json --dir "$project_dir" --session "$session_id" --model "$model_try")
  if [[ -n "$agent_arg" ]]; then
    cmd+=(--agent "$agent_arg")
  fi

  cmd+=(
    -f "$manifest_path"
    -f "$canonical_index_path"
    -f "$canonical_read_order_path"
  )
  if [[ -n "$delta_dir" ]]; then
    cmd+=(
      -f "${delta_dir}/00_delta_manifest.json"
      -f "${delta_dir}/01_changed_files.jsonl"
      -f "${delta_dir}/02_plan_diff.md"
    )
    if [[ -f "$canonical_diff_path" ]]; then
      cmd+=(-f "$canonical_diff_path")
    fi
  fi
  cmd+=(-- "$(cat "$msg_file")")

  : > "$out_jsonl"
  set +e
  run_opencode_limited "$out_jsonl" "$max_runtime_sec" "$max_tool_calls" "${cmd[@]}"
  rc=$?
  set -e
  if [[ $rc -eq 0 ]]; then
    stream_has_errors="$(has_opencode_error_events "$out_jsonl")"
    if [[ "$stream_has_errors" == "1" ]]; then
      rc=86
      echo "warn: opencode stream contained error events with model=${model_try}" >&2
    fi
  fi
  if [[ $rc -eq 0 ]]; then
    run_ok="true"
    break
  fi
  echo "warn: opencode send failed with model=${model_try} rc=${rc}" >&2
done

if [[ "$run_ok" != "true" ]]; then
  echo "error: opencode send failed for all configured models (${models_to_try[*]})" >&2
  exit 1
fi

validate_required_response_fields "$out_jsonl" "${required_contract_fields[@]}"

parsed_session="$(python3 - "$out_jsonl" <<'PY'
import json
import sys
from pathlib import Path
sid = ""
for line in Path(sys.argv[1]).read_text(encoding="utf-8", errors="replace").splitlines():
    line = line.strip()
    if not line.startswith("{"):
        continue
    try:
        obj = json.loads(line)
    except Exception:
        continue
    if obj.get("sessionID"):
        sid = obj["sessionID"]
        break
print(sid)
PY
)"

[[ -n "$parsed_session" ]] || { echo "error: failed to parse sessionID from opencode output" >&2; exit 1; }

if [[ "$parsed_session" != "$session_id" ]]; then
  echo "error: session mismatch (expected $session_id got $parsed_session)" >&2
  exit 1
fi

${session_script} set \
  --project "$project_dir" \
  --session-id "$parsed_session" \
  --bundle-id "$bundle_id" \
  --bundle-dir "$bundle_dir" \
  --manifest-path "$manifest_path" \
  --last-delta-dir "$delta_dir" \
  --critical-mode strict \
  --mutual-critique-ready true \
  --mutual-plan-ready true \
  --last-message-at "$(date -u +%Y-%m-%dT%H:%M:%SZ)" >/dev/null

session_log="${project_dir}/.opencode-context/session/messages.jsonl"
mkdir -p "$(dirname "$session_log")"
python3 - "$session_log" "$session_id" "$bundle_id" "$delta_dir" "$msg_file" <<'PY'
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
log = Path(sys.argv[1])
record = {
    "ts": datetime.now(timezone.utc).isoformat(),
    "session_id": sys.argv[2],
    "bundle_id": sys.argv[3],
    "delta_dir": sys.argv[4],
    "message": Path(sys.argv[5]).read_text(encoding="utf-8", errors="replace"),
}
with log.open("a", encoding="utf-8") as f:
    f.write(json.dumps(record, ensure_ascii=False) + "\n")
PY

python3 - "$parsed_session" "$delta_dir" "$canonical_diff_path" <<'PY'
import json
import os
import sys
print(json.dumps({
    "status": "ok",
    "session_id": sys.argv[1],
    "delta_dir": sys.argv[2],
    "canonical_diff": sys.argv[3] if sys.argv[3] and os.path.exists(sys.argv[3]) else "",
}, ensure_ascii=False))
PY

rm -f "$msg_file" "$out_jsonl"
