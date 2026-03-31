#!/usr/bin/env bash
set -euo pipefail

# Keine Webhooks. Keine GitHub Actions. Kein n8n. 100% Fail-Safe.

REPO_URL="git@github.com:Delqhi/opencode.git"
CLONE_DIR="$HOME/.opencode-ssot-repo"
GLOBAL_DIR="$HOME/.config/opencode"
MODULAR_DIR="$CLONE_DIR"
LEGACY_DIR="$CLONE_DIR/global-opencode-config"

echo "[SSOT] Daemon started. Checking every 60 seconds."

# Init clone if missing
if [ ! -d "$CLONE_DIR/.git" ]; then
    echo "[SSOT] Initialising clone..."
    rm -rf "$CLONE_DIR"
    git clone --branch main "$REPO_URL" "$CLONE_DIR"
fi

while true; do
    cd "$CLONE_DIR"
    git fetch origin main >/dev/null 2>&1
    
    LOCAL=$(git rev-parse HEAD)
    REMOTE=$(git rev-parse origin/main)
    
    if [ "$LOCAL" != "$REMOTE" ]; then
        echo "[SSOT] Neues Update gefunden! ($REMOTE)"
        git reset --hard origin/main >/dev/null 2>&1
        git pull origin main >/dev/null 2>&1
        
        echo "[SSOT] Aktualisiere globale Konfiguration..."

        file_src() {
            local bucket="$1"
            local rel="$2"
            if [ -e "$MODULAR_DIR/$bucket/current/$rel" ]; then
                printf '%s\n' "$MODULAR_DIR/$bucket/current/$rel"
                return 0
            fi
            if [ -e "$LEGACY_DIR/$rel" ]; then
                printf '%s\n' "$LEGACY_DIR/$rel"
                return 0
            fi
            return 1
        }

        dir_src() {
            local bucket="$1"
            local rel="$2"
            if [ -d "$MODULAR_DIR/$bucket/current" ]; then
                printf '%s\n' "$MODULAR_DIR/$bucket/current"
                return 0
            fi
            if [ -d "$LEGACY_DIR/$rel" ]; then
                printf '%s\n' "$LEGACY_DIR/$rel"
                return 0
            fi
            return 1
        }

        sync_file() {
            local src="$1"
            local dest="$2"
            [ -e "$src" ] || return 0
            mkdir -p "$(dirname "$dest")"
            cp -f "$src" "$dest"
        }

        sync_tree() {
            local src="$1"
            local dest="$2"
            [ -d "$src" ] || return 0
            mkdir -p "$dest"
            rsync -a \
                --exclude '.git' --exclude 'auth' --exclude 'chrome_profile' \
                --exclude '*accounts.json*' --exclude 'token.json' --exclude 'auth.json' \
                --exclude 'telegram_config.json' --exclude '*.bak*' --exclude '*.db*' \
                --exclude '*.sqlite*' --exclude 'logs' --exclude 'tmp' --exclude 'archive' \
                "$src/" "$dest/"
        }

        sync_file "$(file_src OC-Konfigurationen opencode.json)" "$GLOBAL_DIR/opencode.json"
        sync_file "$(file_src OC-Konfigurationen package.json)" "$GLOBAL_DIR/package.json"
        sync_file "$(file_src OC-Konfigurationen bun.lock)" "$GLOBAL_DIR/bun.lock"
        sync_file "$(file_src OC-Konfigurationen opencode.json.patch)" "$GLOBAL_DIR/opencode.json.patch"
        sync_file "$(file_src MCPs mcp.json)" "$GLOBAL_DIR/mcp.json"

        sync_tree "$(dir_src SIN-Plugins plugins)" "$GLOBAL_DIR/plugins"
        sync_tree "$(dir_src Skills skills)" "$GLOBAL_DIR/skills"
        sync_tree "$(dir_src Tools tools)" "$GLOBAL_DIR/tools"
        sync_tree "$(dir_src Watcher scripts)" "$GLOBAL_DIR/scripts"
        sync_tree "$(dir_src Wrapper scripts)" "$GLOBAL_DIR/scripts"

        echo "[SSOT] Aktualisiere ALLE lokalen Projekte..."
        for dir in "$HOME"/dev/*/.opencode "$HOME"/dev/*/fleet-config; do
            if [ -d "$dir" ]; then
                cp -f "$GLOBAL_DIR/opencode.json" "$dir/" 2>/dev/null || true
                cp -f "$GLOBAL_DIR/mcp.json" "$dir/" 2>/dev/null || true
                rm -rf "$dir/plugins" "$dir/skills" "$dir/tools" "$dir/hooks"
                [ -d "$GLOBAL_DIR/plugins" ] && cp -a "$GLOBAL_DIR/plugins" "$dir/"
                [ -d "$GLOBAL_DIR/skills" ] && cp -a "$GLOBAL_DIR/skills" "$dir/"
                [ -d "$GLOBAL_DIR/tools" ] && cp -a "$GLOBAL_DIR/tools" "$dir/"
                [ -d "$GLOBAL_DIR/hooks" ] && cp -a "$GLOBAL_DIR/hooks" "$dir/"
            fi
        done
        echo "[SSOT] Sync komplett. Alles identisch."
    fi
    
    sleep 60
done
