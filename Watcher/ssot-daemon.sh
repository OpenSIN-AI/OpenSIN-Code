#!/usr/bin/env bash
set -euo pipefail

# OpenSIN-Code SSOT Daemon
REPO_URL="git@github.com:OpenSIN-AI/OpenSIN-Code.git"
CLONE_DIR="$HOME/.opencode-ssot-repo"
GLOBAL_DIR="$HOME/.config/opencode"

if [ ! -d "$CLONE_DIR/.git" ]; then
    rm -rf "$CLONE_DIR"
    git clone --branch main "$REPO_URL" "$CLONE_DIR"
fi

while true; do
    cd "$CLONE_DIR"
    git fetch origin main >/dev/null 2>&1
    LOCAL=$(git rev-parse HEAD)
    REMOTE=$(git rev-parse origin/main)
    
    if [ "$LOCAL" != "$REMOTE" ]; then
        git reset --hard origin/main >/dev/null 2>&1
        git pull origin main >/dev/null 2>&1
        
        # Mappe die neue modulare Repo-Struktur auf das opencode-Format
        cp -f OC-Konfigurationen/opencode.json "$GLOBAL_DIR/opencode.json" 2>/dev/null || true
        cp -f MCPs/mcp.json "$GLOBAL_DIR/mcp.json" 2>/dev/null || true
        
        rsync -a --exclude 'README.md' Skills/ "$GLOBAL_DIR/skills/" 2>/dev/null || true
        rsync -a --exclude 'README.md' Tools/ "$GLOBAL_DIR/tools/" 2>/dev/null || true
        rsync -a --exclude 'README.md' Watcher/ "$GLOBAL_DIR/scripts/" 2>/dev/null || true
        
        # Flache die SIN-Plugins für opencode ab
        find SIN-Plugins -name "*.ts" -exec cp {} "$GLOBAL_DIR/plugins/" \; 2>/dev/null || true
        
        # Verteile auf lokale Projekte
        for dir in "$HOME"/dev/*/.opencode "$HOME"/dev/*/fleet-config; do
            if [ -d "$dir" ]; then
                cp -f "$GLOBAL_DIR/opencode.json" "$dir/" 2>/dev/null || true
                cp -f "$GLOBAL_DIR/mcp.json" "$dir/" 2>/dev/null || true
                rsync -a "$GLOBAL_DIR/plugins/" "$dir/plugins/" 2>/dev/null || true
                rsync -a "$GLOBAL_DIR/skills/" "$dir/skills/" 2>/dev/null || true
            fi
        done
    fi
    sleep 60
done
