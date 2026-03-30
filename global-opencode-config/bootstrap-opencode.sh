#!/usr/bin/env bash
set -euo pipefail

# Bootstrap: Replaces all local opencode.json with symlink to global
# This ensures IMPOSSIBLE to have drift - local files ARE the global file

GLOBAL_CONFIG="$HOME/.config/opencode/opencode.json"
GIT_GLOBAL_CONFIG="$HOME/.open-auth-rotator/opencode.json"

echo "=== OpenCode Config Bootstrap ==="

# Use global config as source of truth
if [[ -f "$GIT_GLOBAL_CONFIG" ]]; then
    GLOBAL_CONFIG="$GIT_GLOBAL_CONFIG"
    echo "Using Git-tracked config: $GLOBAL_CONFIG"
else
    echo "Using local config: $GLOBAL_CONFIG"
fi

# Find and replace all opencode.json with symlinks
find "$HOME/dev" -maxdepth 4 -name "opencode.json" -type f 2>/dev/null | while read -r file; do
    dir=$(dirname "$file")
    
    # Skip non-projects
    [[ "$dir" == *"/backups/"* ]] && continue
    [[ "$dir" == *"/node_modules/"* ]] && continue
    [[ "$dir" == *"/fleet-config/"* ]] && continue
    
    # Remove existing file and create symlink
    if [[ -L "$file" ]]; then
        # Already a symlink - verify it points to global
        target=$(readlink "$file")
        if [[ "$target" != "$GLOBAL_CONFIG" ]]; then
            rm "$file"
            ln -s "$GLOBAL_CONFIG" "$file"
            echo "[SYMLINKED] $file -> $GLOBAL_CONFIG"
        fi
    elif [[ -f "$file" ]]; then
        # Regular file - replace with symlink
        mv "$file" "$file.backup.$(date +%s)"
        ln -s "$GLOBAL_CONFIG" "$file"
        echo "[SYMLINKED + BACKED UP] $file -> $GLOBAL_CONFIG"
    fi
done

echo "Bootstrap complete!"
