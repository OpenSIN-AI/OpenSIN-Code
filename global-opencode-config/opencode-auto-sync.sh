#!/usr/bin/env bash
set -euo pipefail

# === CONFIGURATION ===
GLOBAL_CONFIG="$HOME/.config/opencode/opencode.json"
PROJECTS_FILE="$HOME/.config/opencode/projects.txt"

# === AUTO-LOAD PROJECTS FROM GIT REPOS ===
discover_projects() {
    # Find all git repos with opencode.json
    find "$HOME/dev" -maxdepth 4 -type d -name ".git" 2>/dev/null | while read -r gitdir; do
        project_dir=$(dirname "$gitdir")
        if [[ -f "$project_dir/opencode.json" ]]; then
            # Skip non-projects
            [[ "$project_dir" == *"/backups/"* ]] && continue
            [[ "$project_dir" == *"/node_modules/"* ]] && continue
            [[ "$project_dir" == *"/fleet-config/"* ]] && continue
            echo "$project_dir"
        fi
    done
}

# === SYNC FUNCTION ===
sync_to_project() {
    local project_dir="$1"
    local project_config="$project_dir/opencode.json"
    local backup_dir="$HOME/.config/opencode/backups/$(basename "$project_dir")"
    
    mkdir -p "$backup_dir"
    
    # Backup current config
    if [[ -f "$project_config" ]]; then
        cp "$project_config" "$backup_dir/opencode.json.$(date +%s).bak"
    fi
    
    # Copy global config sections (preserves project identity)
    python3 << PYEOF
import json

# Load global config
with open("$GLOBAL_CONFIG", 'r') as f:
    global_cfg = json.load(f)

# Load project config (or create new)
if open("$project_config", 'r').read().strip():
    with open("$project_config", 'r') as f:
        project_cfg = json.load(f)
else:
    project_cfg = {}

# Sync critical sections
for key in ['provider', 'defaultModel', 'models', 'mcp', 'skills']:
    if key in global_cfg:
        project_cfg[key] = json.loads(json.dumps(global_cfg[key]))

# Write synced config
with open("$project_config", 'w') as f:
    json.dump(project_cfg, f, indent=2)
    f.write('\n')

print(f"[SYNC] $project_config")
PYEOF
}

# === MAIN ===
echo "=== OpenCode Auto-Sync ==="
echo "Global: $GLOBAL_CONFIG"
echo ""

# Discover and sync
count=0
for dir in $(discover_projects | sort -u); do
    sync_to_project "$dir"
    ((count++)) || true
done

echo ""
echo "Synced $count project(s)"
echo ""
echo "=== Done ==="
