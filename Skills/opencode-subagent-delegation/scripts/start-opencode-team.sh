#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"

# Backward-compatible wrapper to persistent collaboration starter.
exec "${script_dir}/start-opencode-collab.sh" "$@"
