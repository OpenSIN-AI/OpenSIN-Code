#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: context-coverage-check.sh --project <dir> --bundle-dir <dir>

Validates:
- required bundle artifacts exist
- every canonical project file appears in inventory
- text entries include fulltext artifacts
- strict secret redaction checks pass
- canonical index/read-order/no-dup audit contracts are valid
USAGE
}

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
resolve_script="${script_dir}/resolve_project_dir.sh"

project_arg=""
bundle_dir=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --project)
      [[ $# -ge 2 ]] || { echo "error: --project requires value" >&2; exit 1; }
      project_arg="$2"
      shift 2
      ;;
    --bundle-dir)
      [[ $# -ge 2 ]] || { echo "error: --bundle-dir requires value" >&2; exit 1; }
      bundle_dir="$2"
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

[[ -n "$bundle_dir" ]] || { echo "error: --bundle-dir is required" >&2; exit 1; }
project_dir="$(${resolve_script} "${project_arg:-}")"

python3 - "$project_dir" "$bundle_dir" <<'PY'
import hashlib
import json
import os
import re
import subprocess
import sys
from pathlib import Path

project_dir = Path(sys.argv[1]).resolve()
bundle_dir = Path(sys.argv[2]).resolve()

required = [
    "00_manifest.json",
    "01_repo_tree.txt",
    "02_file_inventory.jsonl",
    "03_project_summary.md",
    "04_canonical_stack_index.json",
    "05_canonical_read_order.md",
    "10_backend_map.md",
    "11_frontend_map.md",
    "12_db_map.md",
    "13_llm_ai_map.md",
    "14_tests_map.md",
    "15_ops_runbook.md",
    "20_rules_constraints.md",
    "21_todos_risks.md",
    "22_no_duplication_audit.json",
    "30_fulltext",
]

biometrics_required_paths = [
    "rules/global/AGENTS.md",
    "README.md",
    "OPENCODE.md",
    "docs/OPENCODE.md",
    "docs/guides/MIGRATION_V3.md",
    "docs/guides/OPERATOR_RUNBOOK_V3.md",
    "docs/specs/index.json",
    "docs/api/openapi-v3-controlplane.yaml",
    "ARCHITECTURE.md",
    "AGENTS-PLAN.md",
    "rules/global/security-mandates.md",
    "rules/global/documentation-rules.md",
    "rules/global/git-workflow.md",
    "rules/global/AGENT_COLLABORATION.md",
]

missing = [r for r in required if not (bundle_dir / r).exists()]
if missing:
    raise SystemExit(f"missing required bundle artifacts: {missing}")

manifest = json.loads((bundle_dir / "00_manifest.json").read_text(encoding="utf-8"))
profile = manifest.get("profile", "generic")

for field in ("canonical_index_path", "canonical_read_order_path", "no_duplication_audit_path"):
    if not manifest.get(field):
        raise SystemExit(f"manifest missing required field: {field}")
    target = bundle_dir / manifest[field]
    if not target.exists():
        raise SystemExit(f"manifest file reference missing: {field} -> {manifest[field]}")

inventory_path = bundle_dir / "02_file_inventory.jsonl"
inventory = []
with inventory_path.open("r", encoding="utf-8") as f:
    for line in f:
        line = line.strip()
        if not line:
            continue
        inventory.append(json.loads(line))

if not inventory:
    raise SystemExit("inventory is empty")

inv_paths = {e.get("path", "") for e in inventory if e.get("path")}

source = []
source_mode = "bundle-snapshot"
snapshot_rel = manifest.get("source_snapshot_path", "")
if snapshot_rel:
    snapshot_path = bundle_dir / snapshot_rel
    if not snapshot_path.exists():
        raise SystemExit(f"manifest source snapshot missing: {snapshot_rel}")
    raw_lines = snapshot_path.read_text(encoding="utf-8", errors="replace").splitlines()
    for raw in raw_lines:
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        if line.startswith(".opencode-context/"):
            continue
        source.append(line)
    source = sorted(set(source))

expected_snapshot_sha = manifest.get("source_snapshot_sha256", "")
if source and expected_snapshot_sha:
    actual_snapshot_sha = hashlib.sha256((bundle_dir / snapshot_rel).read_bytes()).hexdigest()
    if actual_snapshot_sha != expected_snapshot_sha:
        raise SystemExit("source snapshot checksum mismatch")

if not source:
    source_mode = "live-repo-fallback"
    try:
        chk = subprocess.run(
            ["git", "-C", str(project_dir), "rev-parse", "--is-inside-work-tree"],
            check=True,
            capture_output=True,
            text=True,
        )
        if chk.stdout.strip() == "true":
            out = subprocess.run(
                ["git", "-c", "core.quotepath=false", "-C", str(project_dir), "ls-files", "-co", "--exclude-standard"],
                check=True,
                capture_output=True,
                text=True,
            )
            source = sorted([p.strip() for p in out.stdout.splitlines() if p.strip() and not p.startswith(".opencode-context/")])
        else:
            source = []
    except Exception:
        source = []

    if not source:
        source = []
        for root, dirs, files in os.walk(project_dir):
            rel_root = os.path.relpath(root, project_dir)
            rel_root_norm = "" if rel_root == "." else rel_root.replace("\\", "/")
            dirs[:] = [d for d in dirs if d != ".git" and not (rel_root_norm == "" and d == ".opencode-context")]
            for name in files:
                rel = os.path.relpath(Path(root) / name, project_dir).replace("\\", "/")
                if rel.startswith(".opencode-context/"):
                    continue
                source.append(rel)
        source.sort()

src_paths = set(source)
missing_inventory = sorted(src_paths - inv_paths)
extra_inventory = sorted(inv_paths - src_paths)
if missing_inventory:
    raise SystemExit(f"coverage failed: missing inventory entries for {len(missing_inventory)} files")
if extra_inventory:
    raise SystemExit(f"coverage failed: inventory has {len(extra_inventory)} unknown files")

for entry in inventory:
    if entry.get("kind") != "text":
        continue
    fulltext = entry.get("fulltext") or []
    if not fulltext:
        raise SystemExit(f"text entry missing fulltext artifacts: {entry.get('path')}")
    for rel in fulltext:
        if not (bundle_dir / rel).exists():
            raise SystemExit(f"fulltext artifact missing: {rel}")

canonical_index = json.loads((bundle_dir / manifest["canonical_index_path"]).read_text(encoding="utf-8"))
if canonical_index.get("profile") != profile:
    raise SystemExit("canonical index profile mismatch with manifest")

stack = canonical_index.get("canonical_stack")
if not isinstance(stack, list) or not stack:
    raise SystemExit("canonical stack index is empty or invalid")

stack_paths = {item.get("path", "") for item in stack if isinstance(item, dict)}
if profile == "biometrics":
    missing_stack_paths = [p for p in biometrics_required_paths if p not in stack_paths]
    if missing_stack_paths:
        raise SystemExit(f"biometrics canonical stack missing required paths: {missing_stack_paths}")

    missing_present = [item.get("path", "") for item in stack if item.get("required") and not item.get("exists")]
    if missing_present:
        raise SystemExit(f"biometrics canonical required files are missing in current project: {missing_present}")

read_order_text = (bundle_dir / manifest["canonical_read_order_path"]).read_text(encoding="utf-8", errors="replace")
if profile == "biometrics":
    for p in biometrics_required_paths:
        if p not in read_order_text:
            raise SystemExit(f"canonical read order missing biometrics required path: {p}")

no_dup_audit = json.loads((bundle_dir / manifest["no_duplication_audit_path"]).read_text(encoding="utf-8"))
if no_dup_audit.get("status") != "ok":
    raise SystemExit("no-duplication audit status is not ok")
if no_dup_audit.get("violations"):
    raise SystemExit("no-duplication audit contains violations")

secret_key_re = re.compile(r"(?i)(api[_-]?key|token|secret|password|private[_-]?key)")
assignment_re = re.compile(r"^\s*[A-Za-z_][A-Za-z0-9_]*\s*=\s*(.+)$")
placeholder_re = re.compile(r"(?i)(your[_-]?api[_-]?key|example|placeholder|changeme|dummy|test[_-]?key|fake[_-]?key|sample)")
likely_secret_re = re.compile(r"(?i)(sk-[A-Za-z0-9]{16,}|AIza[0-9A-Za-z\\-_]{20,}|ghp_[A-Za-z0-9]{20,}|[A-Za-z0-9_\\-]{24,})")

for entry in inventory:
    rel = entry.get("path", "")
    if not Path(rel).name.startswith(".env"):
        continue
    for ft_rel in entry.get("fulltext", []):
        txt = (bundle_dir / ft_rel).read_text(encoding="utf-8", errors="replace")
        for line in txt.splitlines():
            m = assignment_re.match(line)
            if not m:
                continue
            value = m.group(1).strip()
            if value and value not in ("[REDACTED]", '"[REDACTED]"', "'[REDACTED]'"):
                raise SystemExit(f"redaction failed in env artifact: {ft_rel}")

for entry in inventory:
    if entry.get("kind") != "text":
        continue
    for ft_rel in entry.get("fulltext", []):
        txt = (bundle_dir / ft_rel).read_text(encoding="utf-8", errors="replace")
        for line in txt.splitlines():
            if secret_key_re.search(line) and (":" in line or "=" in line) and "[REDACTED]" not in line:
                rhs = ""
                if "=" in line:
                    rhs = line.split("=", 1)[1].strip()
                elif ":" in line:
                    rhs = line.split(":", 1)[1].strip()
                rhs = rhs.split("#", 1)[0].split("//", 1)[0].strip()
                if placeholder_re.search(rhs):
                    continue
                if re.search(r"\b(import|export|class|function|const|let|var)\b", line):
                    continue
                # Treat code expressions and non-literal values as non-secrets.
                if re.match(r"^[A-Za-z_][A-Za-z0-9_\\.]*\\(.*\\)$", rhs):
                    continue
                if not likely_secret_re.search(rhs):
                    continue
                raise SystemExit(f"possible unredacted secret line in {ft_rel}: {line[:120]}")

print(json.dumps({
    "status": "ok",
    "project_dir": str(project_dir),
    "bundle_dir": str(bundle_dir),
    "profile": profile,
    "source_mode": source_mode,
    "files_checked": len(source),
    "inventory_entries": len(inventory),
    "canonical_entries": len(stack),
}))
PY
