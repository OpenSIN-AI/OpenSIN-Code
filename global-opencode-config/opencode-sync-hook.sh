#!/usr/bin/env bash
# ~/.config/opencode/opencode-sync-hook.sh
# Called automatically after ANY change to global opencode.json

GLOBAL="$HOME/.config/opencode/opencode.json"
TIMESTAMP=$(date +%s)

echo "[HOOK] Global config changed at $TIMESTAMP"

# Auto-sync to all tracked projects
~/.config/opencode/sync-opencode-config.sh

# Optional: Git commit the change across all repos
# (if projects are git repos)
