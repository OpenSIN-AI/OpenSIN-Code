#!/usr/bin/env bash
set -euo pipefail

# Pre-flight check: ensure antigravity auth is available before opencode starts
# If API key/token is missing, trigger sin-rotate antigravity to get fresh limits

ANTIGRAVITY_TOKEN="$HOME/.config/opencode/auth/google/zukunftsorientierte.energie@gmail.com.json"
ROTATOR="$HOME/.local/bin/sin-rotate"

check_antigravity_auth() {
    if [ -f "$ANTIGRAVITY_TOKEN" ]; then
        return 0
    fi
    return 1
}

if ! check_antigravity_auth; then
    echo "[pre-flight] Antigravity auth token missing, triggering rotation..."
    if [ -x "$ROTATOR" ]; then
        "$ROTATOR" antigravity 2>&1
        echo "[pre-flight] Rotation complete."
    else
        echo "[pre-flight] WARNING: sin-rotate not found at $ROTATOR"
        echo "[pre-flight] Continuing without rotation — opencode may hang."
    fi
fi

# Execute opencode with all original arguments
exec opencode "$@"
