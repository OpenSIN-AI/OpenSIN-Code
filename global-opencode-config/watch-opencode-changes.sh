#!/usr/bin/env bash
set -euo pipefail

# Watches global opencode.json for changes and auto-syncs to all projects
# Uses fswatch or polling as fallback

GLOBAL_CONFIG="$HOME/.config/opencode/opencode.json"
SYNC_SCRIPT="$HOME/.config/opencode/sync-opencode-config.sh"

echo "=== OpenCode Config Watcher ==="
echo "Watching: $GLOBAL_CONFIG"
echo "Sync script: $SYNC_SCRIPT"
echo ""

# Initial sync
echo "[INIT] Running initial sync..."
bash "$SYNC_SCRIPT"

# Check if fswatch is available
if command -v fswatch &> /dev/null; then
    echo "[WATCH] Using fswatch..."
    fswatch -o "$GLOBAL_CONFIG" | while read -r; do
        echo "[CHANGE] Detected at $(date)"
        bash "$SYNC_SCRIPT"
    done
else
    echo "[WATCH] fswatch not found, using polling (5s interval)..."
    last_modified=$(stat -f %m "$GLOBAL_CONFIG" 2>/dev/null || stat -c %Y "$GLOBAL_CONFIG" 2>/dev/null)
    
    while true; do
        current_modified=$(stat -f %m "$GLOBAL_CONFIG" 2>/dev/null || stat -c %Y "$GLOBAL_CONFIG" 2>/dev/null)
        
        if [[ "$current_modified" != "$last_modified" ]]; then
            echo "[CHANGE] Detected at $(date)"
            bash "$SYNC_SCRIPT"
            last_modified="$current_modified"
        fi
        
        sleep 5
    done
fi
