# Context Bundle Spec

Bundle root:
- `<project>/.opencode-context/bundles/<bundle_id>/`

Required files:
- `00_manifest.json`
- `01_repo_tree.txt`
- `02_file_inventory.jsonl`
- `03_project_summary.md`
- `04_canonical_stack_index.json`
- `05_canonical_read_order.md`
- `10_backend_map.md`
- `11_frontend_map.md`
- `12_db_map.md`
- `13_llm_ai_map.md`
- `14_tests_map.md`
- `15_ops_runbook.md`
- `20_rules_constraints.md`
- `21_todos_risks.md`
- `22_no_duplication_audit.json`
- `30_fulltext/`

Profile model:
- `--profile auto|biometrics|generic` (default `auto`)
- Profile detection and canonical stack are derived from files in the current project directory.
- Never reference canonical docs from an external BIOMETRICS repo path.

Coverage rules:
- Every project source file from canonical scan (`git ls-files -co --exclude-standard` when available) must appear in `02_file_inventory.jsonl`.
- Text/code files must have fulltext artifacts.
- Binary files must include metadata (`size`, `sha256`, `mime`, classification).

No-duplication rules:
- Synthesis artifacts (`03`, `10_*`, `15`, `20`) may contain structured references only.
- No copied canonical text blocks longer than 3 consecutive lines.
- `22_no_duplication_audit.json` must report `status: ok`.

Failure gate:
- Missing required file, missing inventory entry, missing canonical structure, no-dup violation, or redaction violation => hard fail.

Manifest required fields:
- `profile`
- `canonical_index_path`
- `canonical_read_order_path`
- `no_duplication_audit_path`

Delta root:
- `<project>/.opencode-context/delta/<timestamp>/`
- Includes:
  - `00_delta_manifest.json`
  - `01_changed_files.jsonl`
  - `02_plan_diff.md`
  - `03_canonical_diff.md`
  - `10_changed_fulltext/`
