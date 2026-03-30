#!/usr/bin/env bash
set -euo pipefail

# Dieses Skript zieht die neueste SSOT Config aus dem geforkten Repo.
# Wird vom n8n Webhook / Cron getriggert.

REPO_URL="https://github.com/Delqhi/opencode.git"
CLONE_DIR="/tmp/opencode-ssot-pull"
TARGET_DIR="$HOME/.config/opencode"

echo "[SSOT-PULL] Starte Synchronisation der globalen Konfiguration..."

# 1. Klonen / Pullen des Repos in ein temporäres Verzeichnis
rm -rf "$CLONE_DIR"
git clone --depth 1 --branch main "$REPO_URL" "$CLONE_DIR" 2>/dev/null

# 2. Kopieren der globalen Konfiguration (ohne Git-Historie)
if [ -d "$CLONE_DIR/global-opencode-config" ]; then
    echo "[SSOT-PULL] Übernehme Konfiguration aus dem Fork..."
    rsync -av --exclude '.git' --exclude 'backups' --exclude 'tmp' "$CLONE_DIR/global-opencode-config/" "$TARGET_DIR/"
    
    # Ausführbare Rechte für Skripte sicherstellen
    find "$TARGET_DIR/scripts" -type f -name "*.sh" -exec chmod +x {} \; 2>/dev/null || true
    
    echo "[SSOT-PULL] ✅ Erfolgreich synchronisiert!"
else
    echo "[SSOT-PULL] ❌ Fehler: Verzeichnis 'global-opencode-config' im Repo nicht gefunden."
    exit 1
fi

# Aufräumen
rm -rf "$CLONE_DIR"
