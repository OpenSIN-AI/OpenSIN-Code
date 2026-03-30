#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: build-project-context-bundle.sh [options]

Options:
  --project <dir>         Project directory (default: git root or PWD)
  --output-root <path>    Bundle output root (default: <project>/.opencode-context/bundles)
  --mask-secrets <mode>   Secret mode, must be "strict" (default: strict)
  --require-complete <v>  Must be true/1 (default: true)
  --profile <mode>        Context profile: auto|biometrics|generic (default: auto)
  -h, --help              Show help

Output:
  JSON with bundle_id, bundle_dir, manifest_path, profile, and counts.
USAGE
}

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
resolve_script="${script_dir}/resolve_project_dir.sh"
coverage_script="${script_dir}/context-coverage-check.sh"

project_arg=""
output_root=""
mask_secrets="strict"
require_complete="true"
profile_mode="auto"

lower() {
  printf '%s' "$1" | tr '[:upper:]' '[:lower:]'
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --project)
      [[ $# -ge 2 ]] || { echo "error: --project requires value" >&2; exit 1; }
      project_arg="$2"
      shift 2
      ;;
    --output-root)
      [[ $# -ge 2 ]] || { echo "error: --output-root requires value" >&2; exit 1; }
      output_root="$2"
      shift 2
      ;;
    --mask-secrets)
      [[ $# -ge 2 ]] || { echo "error: --mask-secrets requires value" >&2; exit 1; }
      mask_secrets="$2"
      shift 2
      ;;
    --require-complete)
      [[ $# -ge 2 ]] || { echo "error: --require-complete requires value" >&2; exit 1; }
      require_complete="$2"
      shift 2
      ;;
    --profile)
      [[ $# -ge 2 ]] || { echo "error: --profile requires value" >&2; exit 1; }
      profile_mode="$(lower "$2")"
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

if [[ "$mask_secrets" != "strict" ]]; then
  echo "error: --mask-secrets must be strict" >&2
  exit 1
fi

case "$(lower "$require_complete")" in
  true|1|yes|on)
    ;;
  *)
    echo "error: --require-complete must be true" >&2
    exit 1
    ;;
esac

case "$profile_mode" in
  auto|biometrics|generic)
    ;;
  *)
    echo "error: --profile must be auto|biometrics|generic" >&2
    exit 1
    ;;
esac

project_dir="$(${resolve_script} "${project_arg:-}")"
if [[ -z "$output_root" ]]; then
  output_root="${project_dir}/.opencode-context/bundles"
fi

bundle_ts="$(date -u +%Y%m%dT%H%M%SZ)"
rand_suffix="$(od -An -N4 -tx1 /dev/urandom | tr -d ' \n')"
bundle_id="${bundle_ts}-${rand_suffix}"
bundle_dir="${output_root}/${bundle_id}"
fulltext_dir="${bundle_dir}/30_fulltext"

mkdir -p "$bundle_dir" "$fulltext_dir"

python3 - "$project_dir" "$bundle_id" "$bundle_dir" "$profile_mode" <<'PY'
import hashlib
import json
import os
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

project_dir = Path(sys.argv[1]).resolve()
bundle_id = sys.argv[2]
bundle_dir = Path(sys.argv[3]).resolve()
profile_arg = sys.argv[4]
fulltext_dir = bundle_dir / "30_fulltext"

required_files = [
    "00_manifest.json",
    "01_repo_tree.txt",
    "02_file_inventory.jsonl",
    "03_project_summary.md",
    "04_canonical_stack_index.json",
    "05_canonical_read_order.md",
    "06_source_snapshot.txt",
    "10_backend_map.md",
    "11_frontend_map.md",
    "12_db_map.md",
    "13_llm_ai_map.md",
    "14_tests_map.md",
    "15_ops_runbook.md",
    "20_rules_constraints.md",
    "21_todos_risks.md",
    "22_no_duplication_audit.json",
]

SECRET_KEY_RE = re.compile(r"(?i)(api[_-]?key|token|secret|password|private[_-]?key|credential)")
ENV_ASSIGN_RE = re.compile(r"^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$")
GENERIC_ASSIGN_RE = re.compile(
    r"(?i)((?:api[_-]?key|token|secret|password|private[_-]?key)\s*[:=]\s*)([^\s,;\]\}\)]+)"
)

backend_markers = (
    "backend", "server", "api", "orchestrator", "worker", "routing", "controlplane", "internal/api", "cmd/"
)
frontend_markers = ("frontend", "ui", "web-v3", "react", "vite", "component", "pages")
db_markers = ("db", "database", "sql", "sqlite", "prisma", "migration", "schema", "store/sqlite")
llm_markers = ("llm", "ai", "prompt", "model", "opencode", "executor")
ops_markers = ("docker", "deploy", "ops", "runbook", "scripts", "release", "metrics")

biometrics_markers = [
    "biometrics-cli/cmd/controlplane",
    "docs/specs/index.json",
    "docs/api/openapi-v3-controlplane.yaml",
    "rules/global/AGENTS.md",
]

biometrics_canonical_stack = [
    ("rules/global/AGENTS.md", 100, "Global runtime/API mandates and legacy boundaries."),
    ("README.md", 95, "Canonical runtime entrypoints, API and operations overview."),
    ("OPENCODE.md", 92, "Root OpenCode guidance with canonical redirects."),
    ("docs/OPENCODE.md", 90, "V3 OpenCode integration policy and constraints."),
    ("docs/guides/MIGRATION_V3.md", 88, "Migration contract and canonical V3 mapping."),
    ("docs/guides/OPERATOR_RUNBOOK_V3.md", 87, "Operational procedures for runtime and incidents."),
    ("docs/specs/index.json", 85, "Typed contract inventory for API/runtime schemas."),
    ("docs/api/openapi-v3-controlplane.yaml", 84, "OpenAPI source of truth for control-plane endpoints."),
    ("ARCHITECTURE.md", 82, "Project architecture and system decomposition."),
    ("AGENTS-PLAN.md", 80, "Execution and planning governance for agent workflows."),
    ("rules/global/security-mandates.md", 78, "Security enforcement and secrets policy baseline."),
    ("rules/global/documentation-rules.md", 77, "Documentation quality and structure mandates."),
    ("rules/global/git-workflow.md", 76, "Branching, commit and PR process rules."),
    ("rules/global/AGENT_COLLABORATION.md", 75, "Agent collaboration and escalation contract."),
]

generic_canonical_stack = [
    ("AGENTS.md", 100, "Project-level agent rules and collaboration guidance."),
    ("README.md", 95, "Project overview, runtime and operator entrypoints."),
    ("ARCHITECTURE.md", 90, "System architecture decisions and boundaries."),
    ("OPENCODE.md", 88, "OpenCode/project integration guidance."),
    ("docs/OPENCODE.md", 86, "Extended OpenCode integration details."),
    ("docs/guides/MIGRATION_V3.md", 84, "Migration guide and compatibility notes."),
    ("docs/guides/OPERATOR_RUNBOOK_V3.md", 83, "Operational runbook and emergency controls."),
    ("docs/specs/index.json", 82, "Contract index and API inventory."),
    ("docs/api/openapi-v3-controlplane.yaml", 81, "OpenAPI service contract."),
]

def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        while True:
            chunk = f.read(1024 * 1024)
            if not chunk:
                break
            h.update(chunk)
    return h.hexdigest()


def list_source_files(base: Path):
    try:
        proc = subprocess.run(
            ["git", "-C", str(base), "rev-parse", "--is-inside-work-tree"],
            check=True,
            capture_output=True,
            text=True,
        )
        if proc.stdout.strip() == "true":
            out = subprocess.run(
                ["git", "-c", "core.quotepath=false", "-C", str(base), "ls-files", "-co", "--exclude-standard"],
                check=True,
                capture_output=True,
                text=True,
            )
            files = [line.strip() for line in out.stdout.splitlines() if line.strip()]
            return sorted([f for f in files if not f.startswith(".opencode-context/")]), "git-ls-files"
    except Exception:
        pass

    files = []
    for root, dirs, filenames in os.walk(base):
        rel_root = os.path.relpath(root, base)
        rel_root_norm = "" if rel_root == "." else rel_root.replace("\\", "/")
        dirs[:] = [
            d for d in dirs
            if d != ".git" and not (rel_root_norm == "" and d == ".opencode-context")
        ]
        for name in filenames:
            p = Path(root) / name
            rel = os.path.relpath(p, base).replace("\\", "/")
            if rel.startswith(".opencode-context/"):
                continue
            files.append(rel)
    return sorted(files), "filesystem"


def is_text_file(path: Path) -> bool:
    try:
        data = path.read_bytes()
    except Exception:
        return False
    if b"\x00" in data:
        return False
    if not data:
        return True
    try:
        data.decode("utf-8")
        return True
    except UnicodeDecodeError:
        return False


def mime_type(path: Path) -> str:
    try:
        out = subprocess.run(["file", "--mime-type", "-b", str(path)], check=True, capture_output=True, text=True)
        return out.stdout.strip() or "application/octet-stream"
    except Exception:
        return "application/octet-stream"


def redact_text(rel_path: str, text: str) -> str:
    is_env = Path(rel_path).name.startswith(".env")

    out_lines = []
    for line in text.splitlines():
        if is_env and line.strip() and not line.strip().startswith("#"):
            m = ENV_ASSIGN_RE.match(line)
            if m:
                out_lines.append(f"{m.group(1)}=[REDACTED]")
                continue

        if SECRET_KEY_RE.search(line):
            line = GENERIC_ASSIGN_RE.sub(r"\1[REDACTED]", line)
            if ":" in line and "[REDACTED]" not in line and SECRET_KEY_RE.search(line):
                parts = line.split(":", 1)
                line = f"{parts[0]}: [REDACTED]"
        out_lines.append(line)

    return "\n".join(out_lines) + ("\n" if text.endswith("\n") else "")


def chunk_write(rel_path: str, sha: str, content: str):
    chunk_size = 12000
    safe_rel = re.sub(r"[^A-Za-z0-9._-]", "_", rel_path)
    rel_hash = hashlib.sha256(rel_path.encode("utf-8")).hexdigest()[:12]
    chunks = [content[i:i + chunk_size] for i in range(0, len(content), chunk_size)] or [""]
    out = []
    total = len(chunks)
    for i, chunk in enumerate(chunks, start=1):
        name = f"{rel_hash}_{safe_rel}.part{i:04d}.md"
        target = fulltext_dir / name
        target.write_text(
            f"# Context Fulltext\n\n"
            f"- source_path: {rel_path}\n"
            f"- source_sha256: {sha}\n"
            f"- chunk: {i}/{total}\n\n"
            f"```text\n{chunk}\n```\n",
            encoding="utf-8",
        )
        out.append(str(target.relative_to(bundle_dir)).replace("\\", "/"))
    return out


def write_repo_tree(file_list):
    tree_path = bundle_dir / "01_repo_tree.txt"
    lines = ["# Repository Tree (canonical source set)", ""]
    for rel in file_list:
        lines.append(rel)
    tree_path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def write_source_snapshot(file_list):
    snapshot_path = bundle_dir / "06_source_snapshot.txt"
    lines = ["# Source Snapshot", ""]
    lines.extend(file_list)
    snapshot_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return hashlib.sha256(snapshot_path.read_bytes()).hexdigest()


def detect_profile(base: Path, requested: str):
    if requested in ("biometrics", "generic"):
        marker_hits = [m for m in biometrics_markers if (base / m).exists()]
        return requested, marker_hits

    marker_hits = [m for m in biometrics_markers if (base / m).exists()]
    if len(marker_hits) >= 2:
        return "biometrics", marker_hits
    return "generic", marker_hits


def short_context_from_path(rel: str, domain: str):
    low = rel.lower()
    if domain == "backend":
        if "cmd/" in low:
            return "Runtime entrypoint or command surface."
        if "/internal/" in low:
            return "Core backend implementation module."
        return "Backend/API related source."
    if domain == "frontend":
        if "web" in low or "ui" in low:
            return "Frontend surface or UI module."
        return "Frontend related source."
    if domain == "db":
        if "schema" in low:
            return "Schema definition or migration contract."
        return "Database/store related source."
    if domain == "llm":
        if "prompt" in low:
            return "Prompt orchestration or prompt asset."
        return "LLM/agent execution related source."
    if domain == "ops":
        if "runbook" in low:
            return "Operational runbook or operator procedure."
        return "Operational/deployment related source."
    if domain == "tests":
        return "Test coverage and validation source."
    return "Project source artifact."


def compute_priority(rel: str, canonical_priorities: dict, default_priority: int = 40) -> int:
    if rel in canonical_priorities:
        return canonical_priorities[rel]
    low = rel.lower()
    boost = 0
    if low.startswith("docs/"):
        boost += 15
    if "readme" in low or "architecture" in low or "agents" in low:
        boost += 20
    if "/cmd/" in low or low.startswith("cmd/"):
        boost += 20
    if "/internal/" in low:
        boost += 10
    if low.endswith(".md"):
        boost += 5
    return min(99, default_priority + boost)


def map_section(title: str, files, markers, exts=None, domain="general", canonical_priorities=None):
    exts = exts or set()
    canonical_priorities = canonical_priorities or {}
    selected = []
    for rel in files:
        low = rel.lower()
        suffix = Path(rel).suffix.lower()
        if any(m in low for m in markers) or (exts and suffix in exts):
            selected.append(rel)
    selected = sorted(set(selected))

    lines = [f"# {title}", "", f"- matched_files: {len(selected)}", "", "References:"]
    for rel in selected[:2000]:
        sha = inventory_by_path.get(rel, {}).get("sha256", "")
        pri = compute_priority(rel, canonical_priorities)
        ctx = short_context_from_path(rel, domain)
        lines.append(f"- path: {rel} | sha256: {sha} | priority: {pri} | context: {ctx}")
    if not selected:
        lines.append("- none")
    lines.append("")
    return "\n".join(lines) + "\n"


def write_canonical_stack(profile: str):
    stack_template = biometrics_canonical_stack if profile == "biometrics" else generic_canonical_stack
    entries = []
    missing_required = []
    for rel, priority, context in stack_template:
        p = project_dir / rel
        exists = p.exists() and p.is_file()
        sha = sha256_file(p) if exists else ""
        item = {
            "path": rel,
            "priority": priority,
            "short_context": context,
            "required": profile == "biometrics",
            "exists": exists,
            "sha256": sha,
        }
        entries.append(item)
        if item["required"] and not exists:
            missing_required.append(rel)

    index = {
        "profile": profile,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "project_dir": str(project_dir),
        "canonical_stack": entries,
    }
    (bundle_dir / "04_canonical_stack_index.json").write_text(
        json.dumps(index, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )

    md = ["# Canonical Read Order", "", f"- profile: {profile}", "", "Read in this order:"]
    for i, item in enumerate(entries, start=1):
        status = "present" if item["exists"] else "missing"
        md.append(
            f"{i}. `{item['path']}` | priority={item['priority']} | status={status} | context={item['short_context']}"
        )
    md.append("")
    (bundle_dir / "05_canonical_read_order.md").write_text("\n".join(md), encoding="utf-8")

    if profile == "biometrics" and missing_required:
        raise SystemExit(
            "biometrics profile requires canonical files in current project; missing: " + ", ".join(missing_required)
        )

    return entries


def find_todos(entries):
    todo_hits = []
    todo_re = re.compile(r"\b(TODO|FIXME|HACK|BUG|RISK)\b", re.IGNORECASE)
    for entry in entries:
        if entry["kind"] != "text":
            continue
        rel = entry["path"]
        path = project_dir / rel
        try:
            lines = path.read_text(encoding="utf-8", errors="replace").splitlines()
        except Exception:
            continue
        for i, line in enumerate(lines, start=1):
            if todo_re.search(line):
                todo_hits.append((rel, i, line.strip()[:300]))
    return todo_hits


def normalize_lines(text: str):
    out = []
    for ln in text.splitlines():
        s = ln.strip()
        if not s:
            continue
        out.append(s)
    return out


def max_shared_run(synth_lines, canon_lines):
    if not synth_lines or not canon_lines:
        return 0
    idx = {}
    for j, ln in enumerate(canon_lines):
        if len(ln) < 8:
            continue
        idx.setdefault(ln, []).append(j)

    max_run = 0
    for i, ln in enumerate(synth_lines):
        if len(ln) < 8:
            continue
        for j in idx.get(ln, []):
            run = 1
            while i + run < len(synth_lines) and j + run < len(canon_lines):
                if synth_lines[i + run] != canon_lines[j + run]:
                    break
                run += 1
            if run > max_run:
                max_run = run
            if max_run > 3:
                return max_run
    return max_run


file_list, source_mode = list_source_files(project_dir)
if not file_list:
    raise SystemExit("no project files found for context bundle")

profile, marker_hits = detect_profile(project_dir, profile_arg)

write_repo_tree(file_list)
source_snapshot_sha = write_source_snapshot(file_list)

inventory_path = bundle_dir / "02_file_inventory.jsonl"
inventory_entries = []
text_count = 0
binary_count = 0

for rel in file_list:
    abs_path = project_dir / rel
    if not abs_path.exists() or not abs_path.is_file():
        continue

    sha = sha256_file(abs_path)
    size = abs_path.stat().st_size
    mime = mime_type(abs_path)

    if is_text_file(abs_path):
        text_count += 1
        raw = abs_path.read_text(encoding="utf-8", errors="replace")
        redacted = redact_text(rel, raw)
        parts = chunk_write(rel, sha, redacted)
        entry = {
            "path": rel,
            "kind": "text",
            "size": size,
            "sha256": sha,
            "mime": mime,
            "fulltext": parts,
        }
    else:
        binary_count += 1
        entry = {
            "path": rel,
            "kind": "binary",
            "size": size,
            "sha256": sha,
            "mime": mime,
            "fulltext": [],
            "classification": "binary-asset",
        }
    inventory_entries.append(entry)

with inventory_path.open("w", encoding="utf-8") as f:
    for entry in inventory_entries:
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")

inventory_sha = hashlib.sha256(inventory_path.read_bytes()).hexdigest()
inventory_by_path = {entry["path"]: entry for entry in inventory_entries}

canonical_entries = write_canonical_stack(profile)
canonical_priorities = {e["path"]: e["priority"] for e in canonical_entries}

summary_lines = [
    "# Project Summary",
    "",
    f"- project_dir: {project_dir}",
    f"- bundle_id: {bundle_id}",
    f"- source_mode: {source_mode}",
    f"- profile: {profile}",
    f"- profile_arg: {profile_arg}",
    f"- profile_marker_hits: {len(marker_hits)}",
    f"- total_files: {len(inventory_entries)}",
    f"- text_files: {text_count}",
    f"- binary_files: {binary_count}",
    "",
    "## Canonical Stack References",
]
for item in canonical_entries:
    state = "present" if item["exists"] else "missing"
    summary_lines.append(
        f"- path: {item['path']} | sha256: {item['sha256']} | priority: {item['priority']} | status: {state} | context: {item['short_context']}"
    )
summary_lines.append("")
(bundle_dir / "03_project_summary.md").write_text("\n".join(summary_lines), encoding="utf-8")

files_for_maps = [e["path"] for e in inventory_entries]
(bundle_dir / "10_backend_map.md").write_text(
    map_section("Backend Map", files_for_maps, backend_markers, {".py", ".go", ".java", ".rb", ".php", ".cs", ".ts", ".js"}, "backend", canonical_priorities),
    encoding="utf-8",
)
(bundle_dir / "11_frontend_map.md").write_text(
    map_section("Frontend Map", files_for_maps, frontend_markers, {".tsx", ".jsx", ".vue", ".svelte", ".css", ".scss", ".html"}, "frontend", canonical_priorities),
    encoding="utf-8",
)
(bundle_dir / "12_db_map.md").write_text(
    map_section("DB Map", files_for_maps, db_markers, {".sql", ".db", ".sqlite", ".prisma"}, "db", canonical_priorities),
    encoding="utf-8",
)
(bundle_dir / "13_llm_ai_map.md").write_text(
    map_section("LLM and AI Map", files_for_maps, llm_markers, {".prompt", ".md", ".py", ".ts", ".js"}, "llm", canonical_priorities),
    encoding="utf-8",
)
(bundle_dir / "14_tests_map.md").write_text(
    map_section("Tests Map", [p for p in files_for_maps if "test" in p.lower() or "/tests/" in p.lower()], ("test",), {".ts", ".js", ".py", ".go"}, "tests", canonical_priorities),
    encoding="utf-8",
)
(bundle_dir / "15_ops_runbook.md").write_text(
    map_section("Ops Runbook Index", files_for_maps, ops_markers, {".sh", ".yml", ".yaml", ".toml", ".md"}, "ops", canonical_priorities),
    encoding="utf-8",
)

rules_candidates = []
for rel in files_for_maps:
    low = rel.lower()
    if (
        "rules" in low
        or "policy" in low
        or "security" in low
        or "agent" in low
        or "architecture" in low
        or "plan" in low
        or "readme" in low
        or "opencode" in low
    ):
        rules_candidates.append(rel)
rules_candidates = sorted(set(rules_candidates))

rules_lines = ["# Rules and Constraints", "", "References:"]
for rel in rules_candidates[:2500]:
    sha = inventory_by_path.get(rel, {}).get("sha256", "")
    pri = compute_priority(rel, canonical_priorities)
    ctx = short_context_from_path(rel, "ops")
    rules_lines.append(f"- path: {rel} | sha256: {sha} | priority: {pri} | context: {ctx}")
if not rules_candidates:
    rules_lines.append("- none")
rules_lines.append("")
(bundle_dir / "20_rules_constraints.md").write_text("\n".join(rules_lines), encoding="utf-8")

todo_hits = find_todos(inventory_entries)
todo_lines = [
    "# TODOs and Risks",
    "",
    f"- hit_count: {len(todo_hits)}",
    "",
]
for rel, line_no, text in todo_hits[:4000]:
    sha = inventory_by_path.get(rel, {}).get("sha256", "")
    pri = compute_priority(rel, canonical_priorities, default_priority=45)
    todo_lines.append(f"- path: {rel} | sha256: {sha} | priority: {pri} | location: {line_no} | note: {text}")
if not todo_hits:
    todo_lines.append("- none")
(bundle_dir / "21_todos_risks.md").write_text("\n".join(todo_lines) + "\n", encoding="utf-8")

synthesis_files = [
    "03_project_summary.md",
    "10_backend_map.md",
    "11_frontend_map.md",
    "12_db_map.md",
    "13_llm_ai_map.md",
    "14_tests_map.md",
    "15_ops_runbook.md",
    "20_rules_constraints.md",
]

canonical_existing = [item for item in canonical_entries if item["exists"]]
violations = []
for synth in synthesis_files:
    synth_path = bundle_dir / synth
    synth_lines = normalize_lines(synth_path.read_text(encoding="utf-8", errors="replace"))
    for item in canonical_existing:
        canonical_text = (project_dir / item["path"]).read_text(encoding="utf-8", errors="replace")
        canon_lines = normalize_lines(canonical_text)
        run = max_shared_run(synth_lines, canon_lines)
        if run > 3:
            violations.append(
                {
                    "synthesis_file": synth,
                    "canonical_file": item["path"],
                    "max_shared_run": run,
                }
            )

audit = {
    "rule": "no copied canonical text blocks longer than 3 lines in synthesis artifacts",
    "max_allowed_run": 3,
    "checked_at": datetime.now(timezone.utc).isoformat(),
    "synthesis_files": synthesis_files,
    "canonical_files": [item["path"] for item in canonical_existing],
    "violations": violations,
    "status": "ok" if not violations else "fail",
}
(bundle_dir / "22_no_duplication_audit.json").write_text(
    json.dumps(audit, indent=2, ensure_ascii=False) + "\n",
    encoding="utf-8",
)
if violations:
    raise SystemExit("no-duplication audit failed: copied canonical text blocks exceed 3 lines")

manifest = {
    "schema_version": 2,
    "bundle_id": bundle_id,
    "created_at": datetime.now(timezone.utc).isoformat(),
    "project_dir": str(project_dir),
    "source_mode": source_mode,
    "profile": profile,
    "profile_arg": profile_arg,
    "profile_marker_hits": marker_hits,
    "secrets_policy": "strict-redaction",
    "coverage_complete": True,
    "required_files": required_files,
    "source_snapshot_path": "06_source_snapshot.txt",
    "source_snapshot_sha256": source_snapshot_sha,
    "inventory_sha256": inventory_sha,
    "counts": {
        "total_files": len(inventory_entries),
        "text_files": text_count,
        "binary_files": binary_count,
    },
    "canonical_index_path": "04_canonical_stack_index.json",
    "canonical_read_order_path": "05_canonical_read_order.md",
    "no_duplication_audit_path": "22_no_duplication_audit.json",
}
manifest_path = bundle_dir / "00_manifest.json"
manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
PY

"${coverage_script}" --project "$project_dir" --bundle-dir "$bundle_dir" >/dev/null

python3 - "$bundle_dir" <<'PY'
import json
import sys
from pathlib import Path

bundle_dir = Path(sys.argv[1]).resolve()
manifest = json.loads((bundle_dir / "00_manifest.json").read_text(encoding="utf-8"))
print(json.dumps({
    "bundle_id": manifest["bundle_id"],
    "bundle_dir": str(bundle_dir),
    "manifest_path": str(bundle_dir / "00_manifest.json"),
    "project_dir": manifest["project_dir"],
    "profile": manifest.get("profile", "generic"),
    "source_snapshot_path": str(bundle_dir / manifest.get("source_snapshot_path", "06_source_snapshot.txt")),
    "canonical_index_path": str(bundle_dir / manifest["canonical_index_path"]),
    "canonical_read_order_path": str(bundle_dir / manifest["canonical_read_order_path"]),
    "no_duplication_audit_path": str(bundle_dir / manifest["no_duplication_audit_path"]),
    "counts": manifest["counts"],
    "coverage": "ok"
}, ensure_ascii=False))
PY
