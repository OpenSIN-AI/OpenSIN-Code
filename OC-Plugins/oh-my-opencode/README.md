# 🔌 OC-Plugin: oh-my-opencode

## Overview
Official awesome-opencode plugin that registers slash commands (`/create-a2a`, `/sovereign-research`) from the `Skills/` directory and manages custom subagents (Sisyphus, Metis, Prometheus).

## Configuration
Requires `oh-my-opencode.json` in the root config directory. Agents are mapped directly to models (e.g., `openai/gpt-5.4`).

## Best Practices
- Never manually install globally via `npm i -g`. Let the SSOT daemon pull the plugin definition and rely on the OpenCode plugin manager.
