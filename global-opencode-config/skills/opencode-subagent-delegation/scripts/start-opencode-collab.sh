#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: start-opencode-collab.sh [options]

Options:
  --project <dir>          Project directory
  --agent <name>           Opencode primary agent
  --model <provider/model> Opencode model
  --title <text>           Session title
  --profile <mode>         Context profile: auto|biometrics|generic (default: auto)
  --proactive-mode <mode>  Proactive mode (default: maximal)
  --max-runtime-sec <n>    Hard runtime cap per opencode run (default: 420)
  --max-tool-calls <n>     Hard tool-call cap per opencode run (default: 16)
  -h, --help               Show help

Behavior:
- Builds full context bundle (strict redaction + coverage gate)
- Starts opencode run and captures session id
- Uses ordered model fallback chain (`OPENCODE_MODEL_FALLBACK_CHAIN` or primary->fallback->tertiary defaults)
- Uses `OPENCODE_BIN` when set, otherwise resolves `opencode` from PATH
- Requires CONTEXT_READY + CONTEXT_PROFILE + MUTUAL_CRITIQUE_COMPLETE + MUTUAL_PLAN_READY acknowledgment
- Stores session state in .opencode-context/session/state.json
USAGE
}

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
resolve_script="${script_dir}/resolve_project_dir.sh"
bundle_script="${script_dir}/build-project-context-bundle.sh"
session_script="${script_dir}/session-state.sh"
send_script="${script_dir}/send-opencode-collab-message.sh"
prompt_file="${script_dir}/../references/delegation-prompt.md"

project_arg=""
agent_arg=""
model_arg=""
title_arg=""
profile_mode="auto"
proactive_mode="maximal"
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

validate_kickoff_critique() {
  local out_jsonl="$1"
  python3 - "$out_jsonl" <<'PY'
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
tags = ["logic_gap", "objective_mismatch", "scope_adjustment", "risk_correction"]
if not any(tag in text for tag in tags):
    raise SystemExit("kickoff critique missing concrete correction tags (logic_gap|objective_mismatch|scope_adjustment|risk_correction)")
PY
}

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
    --profile)
      [[ $# -ge 2 ]] || { echo "error: --profile requires value" >&2; exit 1; }
      profile_mode="$2"
      shift 2
      ;;
    --proactive-mode)
      [[ $# -ge 2 ]] || { echo "error: --proactive-mode requires value" >&2; exit 1; }
      proactive_mode="$2"
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

bundle_json="$(${bundle_script} --project "$project_dir" --profile "$profile_mode" --mask-secrets strict --require-complete true)"

bundle_id="$(python3 - "$bundle_json" <<'PY'
import json, sys
print(json.loads(sys.argv[1])["bundle_id"])
PY
)"
bundle_dir="$(python3 - "$bundle_json" <<'PY'
import json, sys
print(json.loads(sys.argv[1])["bundle_dir"])
PY
)"
manifest_path="$(python3 - "$bundle_json" <<'PY'
import json, sys
print(json.loads(sys.argv[1])["manifest_path"])
PY
)"
profile_resolved="$(python3 - "$bundle_json" <<'PY'
import json, sys
print(json.loads(sys.argv[1]).get("profile", "generic"))
PY
)"
canonical_index_path="$(python3 - "$bundle_json" <<'PY'
import json, sys
print(json.loads(sys.argv[1]).get("canonical_index_path", ""))
PY
)"
canonical_read_order_path="$(python3 - "$bundle_json" <<'PY'
import json, sys
print(json.loads(sys.argv[1]).get("canonical_read_order_path", ""))
PY
)"
no_dup_audit_path="$(python3 - "$bundle_json" <<'PY'
import json, sys
print(json.loads(sys.argv[1]).get("no_duplication_audit_path", ""))
PY
)"

[[ -n "$canonical_index_path" ]] || { echo "error: missing canonical_index_path in bundle output" >&2; exit 1; }
[[ -n "$canonical_read_order_path" ]] || { echo "error: missing canonical_read_order_path in bundle output" >&2; exit 1; }

canonical_project_files=()
while IFS= read -r line; do
  [[ -n "$line" ]] && canonical_project_files+=("$line")
done < <(python3 - "$project_dir" "$canonical_index_path" <<'PY'
import json
import sys
from pathlib import Path

project_dir = Path(sys.argv[1]).resolve()
index_path = Path(sys.argv[2]).resolve()
obj = json.loads(index_path.read_text(encoding="utf-8"))
for item in obj.get("canonical_stack", []):
    p = item.get("path")
    exists = item.get("exists")
    if not p or not exists:
        continue
    target = project_dir / p
    if target.exists() and target.is_file():
        print(str(target))
PY
)

kickoff_template="$(cat "$prompt_file")"
kickoff_message_file="$(mktemp)"
cat > "$kickoff_message_file" <<MSG
${kickoff_template}

Session kickoff requirements:
1. Read all attached context artifacts in this order:
   - 00_manifest.json
   - 04_canonical_stack_index.json
   - 05_canonical_read_order.md
   - 22_no_duplication_audit.json
   - 01_repo_tree.txt
   - 02_file_inventory.jsonl
   - 03_project_summary.md
   - 10_backend_map.md
   - 11_frontend_map.md
   - 12_db_map.md
   - 13_llm_ai_map.md
   - 14_tests_map.md
   - 15_ops_runbook.md
   - 20_rules_constraints.md
   - 21_todos_risks.md
   - then canonical project source files from the index
2. Confirm exactly:
   - CONTEXT_READY bundle_id=${bundle_id}
   - CONTEXT_PROFILE=${profile_resolved}
   - MUTUAL_CRITIQUE_COMPLETE
   - MUTUAL_PLAN_READY
3. Do NOT execute files/code changes before all four readiness lines are confirmed.
4. Run a skeptical prompt audit and provide at least one concrete correction tagged as:
   - logic_gap
   - objective_mismatch
   - scope_adjustment
   - risk_correction
5. Resolve conflicts by canonical priority, then continue execution.
6. Build a shared plan table with owner values: Codex, Opencode, Joint.
7. Keep all work in this project directory: ${project_dir}
8. Each substantial reply must contain these fields exactly:
   - prompt_logic_review
   - objective_refinement
   - opencode_critique_of_codex
   - codex_challenge_requested
   - conflicts_resolved_with_priority
   - plan_status
   - work_done
   - delegated_subtasks
   - risks_or_blockers
   - next_steps
9. Respect hard run limits:
   - max_runtime_sec=${max_runtime_sec}
   - max_tool_calls=${max_tool_calls}
10. Critical mode is strict mutual skepticism.

Context bundle root:
${bundle_dir}
MSG

out_jsonl="$(mktemp)"
build_model_chain

selected_model=""
run_ok="false"
for model_try in "${models_to_try[@]}"; do
  cmd=("$opencode_cmd" run --format json --dir "$project_dir" --model "$model_try")

  if [[ -n "$agent_arg" ]]; then
    cmd+=(--agent "$agent_arg")
  fi
  if [[ -n "$title_arg" ]]; then
    cmd+=(--title "$title_arg")
  fi

  cmd+=(
    -f "$manifest_path"
    -f "$canonical_index_path"
    -f "$canonical_read_order_path"
    -f "$no_dup_audit_path"
    -f "${bundle_dir}/01_repo_tree.txt"
    -f "${bundle_dir}/02_file_inventory.jsonl"
    -f "${bundle_dir}/03_project_summary.md"
    -f "${bundle_dir}/10_backend_map.md"
    -f "${bundle_dir}/11_frontend_map.md"
    -f "${bundle_dir}/12_db_map.md"
    -f "${bundle_dir}/13_llm_ai_map.md"
    -f "${bundle_dir}/14_tests_map.md"
    -f "${bundle_dir}/15_ops_runbook.md"
    -f "${bundle_dir}/20_rules_constraints.md"
    -f "${bundle_dir}/21_todos_risks.md"
  )

  for path in "${canonical_project_files[@]}"; do
    cmd+=(-f "$path")
  done

  cmd+=(-- "$(cat "$kickoff_message_file")")
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
    selected_model="$model_try"
    run_ok="true"
    break
  fi
  echo "warn: opencode kickoff failed with model=${model_try} rc=${rc}" >&2
done

if [[ "$run_ok" != "true" ]]; then
  echo "error: opencode kickoff failed for all configured models (${models_to_try[*]})" >&2
  exit 1
fi

session_id="$(python3 - "$out_jsonl" <<'PY'
import json
import sys
from pathlib import Path

p = Path(sys.argv[1])
session_id = ""
for line in p.read_text(encoding="utf-8", errors="replace").splitlines():
    line = line.strip()
    if not line or not line.startswith("{"):
        continue
    try:
        obj = json.loads(line)
    except Exception:
        continue
    sid = obj.get("sessionID")
    if sid:
        session_id = sid
        break
print(session_id)
PY
)"

[[ -n "$session_id" ]] || { echo "error: unable to parse sessionID from opencode output" >&2; exit 1; }

if ! rg -q "CONTEXT_READY bundle_id=${bundle_id}" "$out_jsonl"; then
  echo "error: CONTEXT_READY acknowledgement missing; blocking delegation" >&2
  exit 1
fi
if ! rg -q "CONTEXT_PROFILE=${profile_resolved}" "$out_jsonl"; then
  echo "error: CONTEXT_PROFILE acknowledgement missing; blocking delegation" >&2
  exit 1
fi
if ! rg -q "MUTUAL_CRITIQUE_COMPLETE" "$out_jsonl"; then
  echo "error: MUTUAL_CRITIQUE_COMPLETE acknowledgement missing; blocking delegation" >&2
  exit 1
fi
if ! rg -q "MUTUAL_PLAN_READY" "$out_jsonl"; then
  echo "error: MUTUAL_PLAN_READY acknowledgement missing; blocking delegation" >&2
  exit 1
fi

validate_kickoff_critique "$out_jsonl"
validate_required_response_fields "$out_jsonl" "${required_contract_fields[@]}"

${session_script} set \
  --project "$project_dir" \
  --session-id "$session_id" \
  --bundle-id "$bundle_id" \
  --bundle-dir "$bundle_dir" \
  --manifest-path "$manifest_path" \
  --proactive-mode "$proactive_mode" \
  --critical-mode strict \
  --context-ready true \
  --mutual-critique-ready true \
  --mutual-plan-ready true \
  --last-message-at "$(date -u +%Y-%m-%dT%H:%M:%SZ)" >/dev/null

send_cmd=(env)
if [[ -n "${OPENCODE_BIN:-}" ]]; then
  send_cmd+=("OPENCODE_BIN=${OPENCODE_BIN}")
fi
if [[ -n "${OPENCODE_MODEL_FALLBACK_CHAIN:-}" ]]; then
  send_cmd+=("OPENCODE_MODEL_FALLBACK_CHAIN=${OPENCODE_MODEL_FALLBACK_CHAIN}")
fi
send_cmd+=(
  "${send_script}"
  --project "$project_dir"
  --session-id "$session_id"
  --with-delta false
  --max-runtime-sec "$max_runtime_sec"
  --max-tool-calls "$max_tool_calls"
  --message "Create/refine the shared implementation plan now using strict mutual skepticism. Required columns: step, owner(Codex/Opencode/Joint), status, risk, next-action, challenge_decision(accept|rework|escalate). Include the full critical response contract fields."
)
initial_plan_out="$(mktemp)"
if ! "${send_cmd[@]}" >"$initial_plan_out" 2>&1; then
  echo "error: initial shared-plan follow-up failed after kickoff" >&2
  echo "detail: tail of follow-up output:" >&2
  tail -n 80 "$initial_plan_out" >&2 || true
  rm -f "$initial_plan_out"
  exit 1
fi
rm -f "$initial_plan_out"

state_path="$(${session_script} path --project "$project_dir")"

python3 - "$session_id" "$bundle_id" "$bundle_dir" "$state_path" "$profile_resolved" <<'PY'
import json
import sys
print(json.dumps({
    "status": "ok",
    "session_id": sys.argv[1],
    "bundle_id": sys.argv[2],
    "bundle_dir": sys.argv[3],
    "state_path": sys.argv[4],
    "profile": sys.argv[5],
}, ensure_ascii=False))
PY

rm -f "$kickoff_message_file" "$out_jsonl"
