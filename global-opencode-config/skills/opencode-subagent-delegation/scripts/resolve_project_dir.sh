#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: resolve_project_dir.sh [project_dir]

Resolve the directory used to start opencode:
1) explicit project_dir argument
2) git top-level of current directory
3) current working directory
USAGE
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

if [[ -n "${1:-}" ]]; then
  if [[ ! -d "$1" ]]; then
    echo "error: directory does not exist: $1" >&2
    exit 1
  fi
  cd "$1"
  pwd -P
  exit 0
fi

if git_root="$(git rev-parse --show-toplevel 2>/dev/null)"; then
  cd "$git_root"
  pwd -P
else
  pwd -P
fi
