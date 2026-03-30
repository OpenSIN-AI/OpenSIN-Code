#!/usr/bin/env bash
set -euo pipefail

# 100% Foolproof SSOT Sync Daemon
# Pullt minütlich die global-opencode-config aus dem Fork.
# Keine Webhooks. Keine GitHub Actions. Kein n8n. 100% Fail-Safe.

REPO_URL="git@github.com:Delqhi/opencode.git"
CLONE_DIR="$HOME/.opencode-ssot-repo"
GLOBAL_DIR="$HOME/.config/opencode"

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
        # Wir rsyncen die config OHNE secrets zu überschreiben
        rsync -a \
            --exclude '.git' --exclude 'auth' --exclude 'chrome_profile' \
            --exclude '*accounts.json*' --exclude 'token.json' --exclude 'auth.json' \
            --exclude 'telegram_config.json' --exclude '*.bak*' --exclude '*.db*' \
            --exclude '*.sqlite*' --exclude 'logs' --exclude 'tmp' --exclude 'archive' \
            "$CLONE_DIR/global-opencode-config/" "$GLOBAL_DIR/"
            
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
