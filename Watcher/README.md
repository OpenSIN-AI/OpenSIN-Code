# Watcher

Canonical bucket for daemons and watchers.

Current source: `global-opencode-config/scripts/` watcher entrypoints

Quickstart:
1. Keep long-running sync and watch logic here.
2. Preserve fail-closed behavior for SSOT sync.
3. Treat `ssot-daemon.sh` as the primary entrypoint.

Status: scaffolded, compatibility paths still active.
