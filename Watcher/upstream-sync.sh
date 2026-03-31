#!/usr/bin/env bash
set -euo pipefail

LOG_FILE="/tmp/opencode-upstream-sync.log"
exec >> "$LOG_FILE" 2>&1
echo "[$(date)] Starte vollautonomen Upstream-Sync (anomalyco/opencode -> OpenSIN-AI/OpenSIN-Code)..."

WORK_DIR="/tmp/opencode-upstream-sync-repo"
FORK_URL="git@github.com:OpenSIN-AI/OpenSIN-Code.git"
UPSTREAM_URL="https://github.com/anomalyco/opencode.git"

if [ ! -d "$WORK_DIR/.git" ]; then
    rm -rf "$WORK_DIR"
    git clone --branch main "$FORK_URL" "$WORK_DIR"
fi
cd "$WORK_DIR"

# Upstream konfigurieren und fetchen
git remote remove upstream 2>/dev/null || true
git remote add upstream "$UPSTREAM_URL"
git fetch upstream main

# 100% SICHERER MERGE
# Mit '-X ours' gewinnen bei jedem Dateikonflikt (z.B. README.md) automatisch unsere Änderungen!
if git merge upstream/main -X ours -m "chore: auto-sync upstream anomalyco/opencode (keeping SIN modifications)"; then
    echo "[$(date)] Merge von upstream erfolgreich."
    
    # ABSOLUTE GARANTIE: Die README.md darf niemals die von anomalyco sein!
    # Wir überschreiben sie nach JEDEM Merge wieder hart mit unserer Custom-Version!
    if [ -f "global-opencode-config/SIN_README.md" ]; then
        cp global-opencode-config/SIN_README.md README.md
        git add README.md
        # Committen, falls sich durch den Merge doch etwas eingeschlichen hätte
        git commit -m "docs: enforce custom SIN-OpenCode README.md over upstream" 2>/dev/null || true
    fi
    
    # Push zum eigenen Fork
    git push origin main
    echo "[$(date)] Upstream-Sync & Custom README Protection 100% abgeschlossen!"
else
    echo "[$(date)] ❌ Fehler beim Merge! Breche ab..."
    git merge --abort || true
fi
