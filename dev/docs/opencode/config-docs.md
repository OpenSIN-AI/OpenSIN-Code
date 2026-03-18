# OpenCode Configuration Documentation

## Core Locations
- **Global Config Folder**: `~/.config/opencode/`
- **Global Config File**: `~/.config/opencode/opencode.json` (Here you find the `agent` definitions, including `multimodal-looker` using NVIDIA NIM DINOv2, as well as MCP definitions)
- **Local Project Config**: `.opencode/opencode.json` in the root of any project (WARNING: Local overrides can break global models. Ensure schema compatibility)
- **Skills Folder**: `~/.config/opencode/skills/` (Markdown and logic definitions for loaded skills like `self-healer` or `sora`)
- **Standalone Skill Repos**: `~/dev/skills/<repo-name>/` (repo SSOT for custom standalone OpenCode skills)
- **Plugins**: Integrated via MCP entries in the `opencode.json` (e.g. `sin-team-worker`, `sin-terminal`)
- **Cache**: Depending on the engine, OpenCode caches its responses and workspace states typically inside `.opencode/` and `.config/opencode/cache/`.
- **Logs**: `~/.config/opencode/logs/`

## Agent Configuration
All agents like `omoc`, `sisyphus`, `plan`, `build` are configured within the `agent` object inside `opencode.json`. You can assign the active LLM (like `openai/gpt-5.2` or NIM models).

## Skill Repo Placement Rule
- `~/.config/opencode/skills/` is the runtime install/discovery surface only.
- The repo SSOT for standalone custom skills belongs under `~/dev/skills/`.
- Example: `~/dev/skills/opencode-enterprise-deep-debug-skill/` -> `~/.config/opencode/skills/enterprise-deep-debug/`.
- Do not keep standalone custom skill repos under `~/dev/projects/...` unless they are actually part of a larger product/workspace repo.

## The "Never Use" List
See `~/dev/docs/never-use.md` for tools like Playwright and Selenium that are globally forbidden.
