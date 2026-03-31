#!/usr/bin/env bash
set -euo pipefail

LOG_FILE="${1:-output/browser-crashtest/devtools-mcp.log}"
BROWSER_URL="${2:-}"

mkdir -p "$(dirname "$LOG_FILE")"

ARGS=(--isolated --headless --log-file "$LOG_FILE")
if [[ -n "$BROWSER_URL" ]]; then
  ARGS+=(--browserUrl "$BROWSER_URL")
fi

echo "[info] starting chrome-devtools-mcp (Ctrl+C to stop)"
echo "[info] log: $LOG_FILE"
exec npx -y chrome-devtools-mcp@latest "${ARGS[@]}"
