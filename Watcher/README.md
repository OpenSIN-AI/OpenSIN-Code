# 👀 Watchers & Sync Daemons

## Overview
Contains the background daemons that enforce the OpenSIN-Code SSOT architecture across the global fleet.

## Core Watchers
1. **`ssot-daemon.sh`**: Runs every 60 seconds. Pulls this repository and force-syncs it to `~/.config/opencode/` and all local `~/dev/*` projects.
2. **`upstream-sync.sh`**: Pulls updates from the original `anomalyco/opencode` into the `OpenCode/` directory of this repo.

## Best Practices
- Watchers must be 100% fail-safe (use `set -euo pipefail`).
- Never rely on external webhooks (e.g., n8n) for core configuration sync to avoid chicken-and-egg outages.
