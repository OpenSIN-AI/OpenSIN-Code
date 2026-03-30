#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: build-context-delta.sh [options]

Options:
  --project <dir>        Project directory (default: git root or PWD)
  --output-root <path>   Delta root (default: <project>/.opencode-context/delta)
  --bundle-id <id>       Base bundle id (default: from session state)
  -h, --help             Show help

Output:
  JSON with delta_dir, metadata, and canonical_diff path.
USAGE
}

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
resolve_script="${script_dir}/resolve_project_dir.sh"
session_script="${script_dir}/session-state.sh"

project_arg=""
output_root=""
base_bundle_id=""

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
    --bundle-id)
      [[ $# -ge 2 ]] || { echo "error: --bundle-id requires value" >&2; exit 1; }
      base_bundle_id="$2"
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
if [[ -z "$output_root" ]]; then
  output_root="${project_dir}/.opencode-context/delta"
fi

if [[ -z "$base_bundle_id" ]]; then
  if base_bundle_id="$(${session_script} get --project "$project_dir" --key bundle_id 2>/dev/null || true)"; then
    :
  fi
fi

if [[ -z "$base_bundle_id" ]]; then
  latest_bundle_dir="$(ls -1dt "${project_dir}/.opencode-context/bundles"/* 2>/dev/null | head -n1 || true)"
  if [[ -n "$latest_bundle_dir" ]]; then
    base_bundle_id="$(basename "$latest_bundle_dir")"
  fi
fi

[[ -n "$base_bundle_id" ]] || { echo "error: no base bundle id available" >&2; exit 1; }
base_bundle_dir="${project_dir}/.opencode-context/bundles/${base_bundle_id}"
[[ -d "$base_bundle_dir" ]] || { echo "error: base bundle dir not found: $base_bundle_dir" >&2; exit 1; }

stamp="$(date -u +%Y%m%dT%H%M%SZ)"
delta_dir="${output_root}/${stamp}"
mkdir -p "$delta_dir/10_changed_fulltext"

python3 - "$project_dir" "$base_bundle_dir" "$delta_dir" "$base_bundle_id" <<'PY'
import hashlib
import json
import os
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

project_dir = Path(sys.argv[1]).resolve()
base_bundle_dir = Path(sys.argv[2]).resolve()
delta_dir = Path(sys.argv[3]).resolve()
base_bundle_id = sys.argv[4]

inventory_path = base_bundle_dir / "02_file_inventory.jsonl"
if not inventory_path.exists():
    raise SystemExit(f"base inventory missing: {inventory_path}")

base_inventory = {}
for line in inventory_path.read_text(encoding="utf-8").splitlines():
    if not line.strip():
        continue
    obj = json.loads(line)
    base_inventory[obj["path"]] = obj

manifest = json.loads((base_bundle_dir / "00_manifest.json").read_text(encoding="utf-8"))
profile = manifest.get("profile", "generic")

canonical_index_path = base_bundle_dir / manifest.get("canonical_index_path", "04_canonical_stack_index.json")
canonical_stack = []
if canonical_index_path.exists():
    try:
        canonical_stack = json.loads(canonical_index_path.read_text(encoding="utf-8")).get("canonical_stack", [])
    except Exception:
        canonical_stack = []

SECRET_KEY_RE = re.compile(r"(?i)(api[_-]?key|token|secret|password|private[_-]?key|credential)")
ENV_ASSIGN_RE = re.compile(r"^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$")
GENERIC_ASSIGN_RE = re.compile(
    r"(?i)((?:api[_-]?key|token|secret|password|private[_-]?key)\s*[:=]\s*)([^\s,;\]\}\)]+)"
)

governance_targets = [
    "AGENTS-PLAN.md",
    "ARCHITECTURE.md",
    "README.md",
    "OPENCODE.md",
    "docs/OPENCODE.md",
    "docs/guides/MIGRATION_V3.md",
    "docs/guides/OPERATOR_RUNBOOK_V3.md",
    "docs/specs/index.json",
    "docs/api/openapi-v3-controlplane.yaml",
]


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        while True:
            c = f.read(1024 * 1024)
            if not c:
                break
            h.update(c)
    return h.hexdigest()


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


def redact_text(rel_path: str, text: str) -> str:
    is_env = Path(rel_path).name.startswith(".env")
    out = []
    for line in text.splitlines():
        if is_env and line.strip() and not line.strip().startswith("#"):
            m = ENV_ASSIGN_RE.match(line)
            if m:
                out.append(f"{m.group(1)}=[REDACTED]")
                continue
        if SECRET_KEY_RE.search(line):
            line = GENERIC_ASSIGN_RE.sub(r"\1[REDACTED]", line)
            if ":" in line and "[REDACTED]" not in line and SECRET_KEY_RE.search(line):
                a, _ = line.split(":", 1)
                line = f"{a}: [REDACTED]"
        out.append(line)
    return "\n".join(out) + ("\n" if text.endswith("\n") else "")


def write_changed_fulltext(rel_path: str, sha: str, content: str):
    chunk_size = 12000
    safe_rel = re.sub(r"[^A-Za-z0-9._-]", "_", rel_path)
    rel_hash = hashlib.sha256(rel_path.encode("utf-8")).hexdigest()[:12]
    chunks = [content[i:i + chunk_size] for i in range(0, len(content), chunk_size)] or [""]
    out = []
    for i, chunk in enumerate(chunks, start=1):
        p = delta_dir / "10_changed_fulltext" / f"{rel_hash}_{safe_rel}.part{i:04d}.md"
        p.write_text(
            f"# Delta Fulltext\n\n"
            f"- source_path: {rel_path}\n"
            f"- source_sha256: {sha}\n"
            f"- chunk: {i}/{len(chunks)}\n\n"
            f"```text\n{chunk}\n```\n",
            encoding="utf-8",
        )
        out.append(str(p.relative_to(delta_dir)).replace("\\", "/"))
    return out


def current_source_files(base: Path):
    try:
        chk = subprocess.run(
            ["git", "-C", str(base), "rev-parse", "--is-inside-work-tree"],
            check=True,
            capture_output=True,
            text=True,
        )
        if chk.stdout.strip() == "true":
            out = subprocess.run(
                ["git", "-c", "core.quotepath=false", "-C", str(base), "ls-files", "-co", "--exclude-standard"],
                check=True,
                capture_output=True,
                text=True,
            )
            return sorted([l.strip() for l in out.stdout.splitlines() if l.strip() and not l.startswith(".opencode-context/")]), "git"
    except Exception:
        pass

    files = []
    for root, dirs, filenames in os.walk(base):
        rel_root = os.path.relpath(root, base)
        rel_norm = "" if rel_root == "." else rel_root.replace("\\", "/")
        dirs[:] = [d for d in dirs if d != ".git" and not (rel_norm == "" and d == ".opencode-context")]
        for name in filenames:
            rel = os.path.relpath(Path(root) / name, base).replace("\\", "/")
            if rel.startswith(".opencode-context/"):
                continue
            files.append(rel)
    return sorted(files), "filesystem"


def git_status_entries(base: Path):
    try:
        out = subprocess.run(
            ["git", "-c", "core.quotepath=false", "-C", str(base), "status", "--porcelain=v1", "--untracked-files=all"],
            check=True,
            capture_output=True,
            text=True,
        )
        lines = [l.rstrip("\n") for l in out.stdout.splitlines() if l.strip()]
        entries = []
        for line in lines:
            status = line[:2]
            p = line[3:]
            if " -> " in p:
                old, new = p.split(" -> ", 1)
                entries.append((status, old, "renamed_from"))
                entries.append((status, new, "renamed_to"))
            else:
                entries.append((status, p, "changed"))
        return entries
    except Exception:
        return []


def collect_plan_paths(base: Path):
    paths = set(["PLAN.md", "LASTPLAN.md", "WORKER.md"])  # legacy support
    for item in governance_targets:
        if (base / item).exists():
            paths.add(item)
    rules_dir = base / "rules" / "global"
    if rules_dir.exists() and rules_dir.is_dir():
        for p in rules_dir.glob("*.md"):
            paths.add(str(p.relative_to(base)).replace("\\", "/"))
    return sorted(paths)


files_now, source_mode = current_source_files(project_dir)
status_entries = git_status_entries(project_dir)
status_paths = {p for _, p, _ in status_entries if p and not p.startswith(".opencode-context/")}

changed = []
for rel in sorted(set(list(base_inventory.keys()) + files_now + list(status_paths))):
    if rel.startswith(".opencode-context/"):
        continue
    abs_path = project_dir / rel
    old = base_inventory.get(rel)
    if not abs_path.exists():
        if old is not None:
            changed.append({"path": rel, "status": "deleted", "old_sha256": old.get("sha256", ""), "new_sha256": ""})
        continue
    if not abs_path.is_file():
        continue
    new_sha = sha256_file(abs_path)
    old_sha = old.get("sha256") if old else ""
    if old is None:
        status = "added"
    elif new_sha != old_sha or rel in status_paths:
        status = "modified"
    elif rel in status_paths:
        status = "modified"
    else:
        continue

    entry = {
        "path": rel,
        "status": status,
        "old_sha256": old_sha,
        "new_sha256": new_sha,
        "kind": "text" if is_text_file(abs_path) else "binary",
    }
    if entry["kind"] == "text":
        raw = abs_path.read_text(encoding="utf-8", errors="replace")
        redacted = redact_text(rel, raw)
        entry["fulltext"] = write_changed_fulltext(rel, new_sha, redacted)
    else:
        entry["fulltext"] = []
    changed.append(entry)

changed_path = delta_dir / "01_changed_files.jsonl"
with changed_path.open("w", encoding="utf-8") as f:
    for row in changed:
        f.write(json.dumps(row, ensure_ascii=False) + "\n")

plan_paths = collect_plan_paths(project_dir)
plan_diff = ""
try:
    cmd = ["git", "-C", str(project_dir), "diff", "--"] + plan_paths
    plan_diff = subprocess.run(cmd, check=False, capture_output=True, text=True).stdout
except Exception:
    plan_diff = ""

(delta_dir / "02_plan_diff.md").write_text(
    "# Plan and Governance Diff\n\n"
    f"- profile: {profile}\n"
    f"- compared_paths: {len(plan_paths)}\n\n"
    "```diff\n"
    + (plan_diff[:200000] if plan_diff else "(no plan/governance diff)\n")
    + "\n```\n",
    encoding="utf-8",
)

changed_by_path = {row["path"]: row for row in changed}
canonical_rows = []
for item in canonical_stack:
    path = item.get("path", "")
    priority = item.get("priority", 0)
    if not path:
        continue
    if path in changed_by_path:
        row = changed_by_path[path]
        canonical_rows.append(
            {
                "path": path,
                "priority": priority,
                "status": row["status"],
                "old_sha256": row.get("old_sha256", ""),
                "new_sha256": row.get("new_sha256", ""),
            }
        )

canonical_rows.sort(key=lambda x: (-x["priority"], x["path"]))

canonical_lines = [
    "# Canonical Diff",
    "",
    f"- profile: {profile}",
    f"- canonical_entries_changed: {len(canonical_rows)}",
    "",
    "| priority | path | status | old_sha256 | new_sha256 |",
    "|---:|---|---|---|---|",
]
for row in canonical_rows:
    canonical_lines.append(
        f"| {row['priority']} | {row['path']} | {row['status']} | {row['old_sha256']} | {row['new_sha256']} |"
    )
if not canonical_rows:
    canonical_lines.append("| - | (none) | unchanged |  |  |")
canonical_lines.append("")

(delta_dir / "03_canonical_diff.md").write_text("\n".join(canonical_lines), encoding="utf-8")

snapshot_h = hashlib.sha256()
for rel in files_now:
    abs_path = project_dir / rel
    if not abs_path.exists() or not abs_path.is_file():
        continue
    snapshot_h.update(rel.encode("utf-8"))
    snapshot_h.update(b"\0")
    snapshot_h.update(sha256_file(abs_path).encode("utf-8"))
    snapshot_h.update(b"\n")

manifest = {
    "schema_version": 2,
    "created_at": datetime.now(timezone.utc).isoformat(),
    "project_dir": str(project_dir),
    "base_bundle_id": base_bundle_id,
    "source_mode": source_mode,
    "profile": profile,
    "changed_count": len(changed),
    "current_snapshot_sha256": snapshot_h.hexdigest(),
    "artifacts": {
        "changed_files": "01_changed_files.jsonl",
        "plan_diff": "02_plan_diff.md",
        "canonical_diff": "03_canonical_diff.md",
        "changed_fulltext_dir": "10_changed_fulltext",
    },
}
(delta_dir / "00_delta_manifest.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

print(json.dumps({
    "delta_dir": str(delta_dir),
    "delta_manifest": str(delta_dir / "00_delta_manifest.json"),
    "canonical_diff": str(delta_dir / "03_canonical_diff.md"),
    "changed_count": len(changed),
    "canonical_changed_count": len(canonical_rows),
    "base_bundle_id": base_bundle_id,
}))
PY
