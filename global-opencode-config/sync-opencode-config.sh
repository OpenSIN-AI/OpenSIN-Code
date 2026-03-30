#!/usr/bin/env bash
set -euo pipefail

# Syncs global opencode.json to all tracked projects
# Ensures NO local project ever drifts from global config

GLOBAL_CONFIG="$HOME/.config/opencode/opencode.json"
CONFIG_NAME="opencode.json"
BACKUP_DIR="$HOME/.config/opencode/backups"

# Projects to sync (auto-discovered + manual)
discover_projects() {
    # Find all opencode.json in dev directories
    find "$HOME/dev" -maxdepth 4 -name "$CONFIG_NAME" -type f 2>/dev/null | while read -r path; do
        dir=$(dirname "$path")
        # Skip fleet-config, backups, node_modules
        if [[ "$dir" != *"/backups/"* && "$dir" != *"/node_modules/"* && "$dir" != *"/fleet-config/"* ]]; then
            echo "$dir"
        fi
    done
}

# Main sync
sync_config() {
    local project_dir="$1"
    local project_config="$project_dir/$CONFIG_NAME"
    
    if [[ ! -f "$project_config" ]]; then
        echo "[SKIP] No $CONFIG_NAME in $project_dir"
        return
    fi
    
    # Backup existing config
    mkdir -p "$BACKUP_DIR"
    local backup_file="$BACKUP_DIR/$(basename "$project_dir")-$(date +%Y%m%d-%H%M%S).json"
    cp "$project_config" "$backup_file"
    
    # Merge strategy: preserve project-specific overrides, sync providers/models
    python3 << PYEOF
import json
import sys

with open("$GLOBAL_CONFIG", 'r') as f:
    global_config = json.load(f)

with open("$project_config", 'r') as f:
    project_config = json.load(f)

# Sync critical sections (preserve project identity)
critical_keys = ['provider', 'defaultModel', 'models']
for key in critical_keys:
    if key in global_config:
        project_config[key] = global_config[key].copy()

# Write synced config
with open("$project_config", 'w') as f:
    json.dump(project_config, f, indent=2)
    f.write('\n')

print(f"[SYNC] $project_config")
PYEOF
}

echo "=== OpenCode Config Sync ==="
echo "Global config: $GLOBAL_CONFIG"
echo ""

# Sync all discovered projects
count=0
for dir in $(discover_projects | sort -u); do
    sync_config "$dir"
    ((count++)) || true
done

echo ""
echo "Synced $count project(s)"
