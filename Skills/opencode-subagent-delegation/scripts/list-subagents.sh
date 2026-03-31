#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: list-subagents.sh [subagent|primary|all]

Default mode: subagent
Output format: <name>\t<mode>
USAGE
}

mode="${1:-subagent}"

if [[ "$mode" == "-h" || "$mode" == "--help" ]]; then
  usage
  exit 0
fi

case "$mode" in
  subagent|primary|all)
    ;;
  *)
    echo "error: mode must be one of: subagent, primary, all" >&2
    exit 1
    ;;
esac

if ! command -v opencode >/dev/null 2>&1; then
  echo "error: opencode CLI not found in PATH" >&2
  exit 127
fi

opencode agent list | awk -v mode="$mode" '
/^[A-Za-z0-9._-]+ \((primary|subagent)\)$/ {
  name=$1
  role=$2
  gsub(/[()]/, "", role)
  if (mode == "all" || role == mode) {
    printf "%s\t%s\n", name, role
  }
}
' | sort -u
